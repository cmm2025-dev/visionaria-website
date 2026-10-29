#!/usr/bin/env python3
"""Escribe en el «Parte diario» de la planilla de terreno los registros que deja la app Evidencias.

La app deja un JSON por registro en una carpeta de cola en Dropbox. Este script, en cada pasada:

  1. lee la cola de cada comuna;
  2. descarga la planilla y anota su revisión;
  3. con LibreOffice escribe solo las columnas de ingreso (B a H) en la primera fila libre;
  4. sube la planilla con la condición de que nadie la haya cambiado entretanto;
  5. mueve cada JSON a «procesados» o «rechazados», con su resultado al lado. Nada se borra.

Si la planilla cambió hace poco, está abierta o cambió durante la pasada, no escribe y deja la cola
intacta para la pasada siguiente.

Se ejecuta con el Python que trae LibreOffice, que ya incluye «uno»:
  Windows:  "C:\\Program Files\\LibreOffice\\program\\python.exe" escribir_parte.py --config config.json
Prueba local, sin Dropbox, sobre una copia:
  escribir_parte.py --planilla copia.xlsx --cola carpeta_con_json --salida resultado.xlsx
"""
import argparse
import datetime
import glob
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

import uno
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException

HOJA = 'Parte diario'
FILA_INICIO, FILA_FIN = 5, 3004  # filas de datos (1-based), según la planilla
FILTRO_XLSX = 'Calc MS Excel 2007 XML'
VERSION_REGISTRO = 1
FECHA_BASE = datetime.date(1899, 12, 30)  # día 0 de las fechas de Excel y LibreOffice
RESPALDOS_LOCALES = 10


def log(mensaje):
    linea = '%s  %s' % (datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), mensaje)
    print(linea, flush=True)
    if LOG_PATH:
        with open(LOG_PATH, 'a', encoding='utf-8') as f:
            f.write(linea + '\n')


LOG_PATH = None


# ---------------------------------------------------------------------------- LibreOffice

def prop(nombre, valor):
    p = PropertyValue()
    p.Name, p.Value = nombre, valor
    return p


class Office:
    """LibreOffice sin ventanas, con un perfil propio para no chocar con otro LibreOffice abierto."""

    def __init__(self, soffice):
        self.soffice = soffice

    def __enter__(self):
        self.perfil = tempfile.mkdtemp(prefix='parte_lo_')
        tubo = 'parte_diario_' + uuid.uuid4().hex[:8]
        self.proceso = subprocess.Popen([
            self.soffice, '-env:UserInstallation=' + uno.systemPathToFileUrl(self.perfil),
            '--headless', '--invisible', '--nologo', '--norestore', '--nodefault', '--nolockcheck',
            '--accept=pipe,name=%s;urp;StarOffice.ComponentContext' % tubo,
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        for _ in range(120):
            try:
                ctx = resolver.resolve('uno:pipe,name=%s;urp;StarOffice.ComponentContext' % tubo)
                break
            except NoConnectException:
                if self.proceso.poll() is not None:
                    raise RuntimeError('LibreOffice se cerró al iniciar.')
                time.sleep(0.5)
        else:
            raise RuntimeError('LibreOffice no respondió en 60 segundos.')
        self.desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
        return self

    def abrir(self, ruta):
        return self.desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath(ruta)), '_blank', 0, (
            prop('Hidden', True), prop('MacroExecutionMode', 0), prop('UpdateDocMode', 0),
        ))

    def __exit__(self, *_):
        try:
            self.desktop.terminate()
        except Exception:
            pass
        try:
            self.proceso.wait(timeout=30)
        except subprocess.TimeoutExpired:
            self.proceso.kill()
        shutil.rmtree(self.perfil, ignore_errors=True)


def celdas(doc, nombre):
    return doc.NamedRanges.getByName(nombre).getReferredCells().getDataArray()


# ---------------------------------------------------------------------------- Registro → fila

def distancia_m(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def ref_de(registro):
    return 'ref ' + registro['id'][:8]


def detalle(registro, coords_punto):
    """Observación del técnico, ubicación, autor y una referencia corta que evita escribir dos veces."""
    partes = []
    obs = (registro.get('observacion') or '').strip()
    if obs:
        partes.append(obs)
    gps = registro.get('gps')
    if gps:
        etiqueta = 'Ubicación al registrar' if registro.get('gpsOrigen') == 'gallery' else 'GPS'
        partes.append('%s %.5f, %.5f ±%d m' % (etiqueta, gps['lat'], gps['lon'], round(gps['accuracy'])))
        if coords_punto:
            d = distancia_m(gps['lat'], gps['lon'], coords_punto[0], coords_punto[1])
            partes.append('a %d m del punto KMZ' % round(d) if d < 1000 else
                          'a %s km del punto KMZ' % ('%.1f' % (d / 1000)).replace('.', ','))
    else:
        partes.append('Sin GPS')
    usuario = (registro.get('registro') or '').split('@')[0]
    if usuario:
        partes.append('registró ' + usuario)
    partes.append(ref_de(registro))
    return ' · '.join(partes)


def validar_formato(r):
    if r.get('version') != VERSION_REGISTRO:
        return 'Versión de registro no reconocida.'
    for campo in ('id', 'comuna', 'punto', 'fecha', 'hecho'):
        if not isinstance(r.get(campo), str) or not r[campo].strip():
            return 'Falta el campo «%s».' % campo
    try:
        datetime.date.fromisoformat(r['fecha'])
    except ValueError:
        return 'Fecha no válida.'
    return None


def procesar_planilla(office, entrada, salida, registros, hoy):
    """Escribe los registros en una copia de la planilla. Devuelve (resultados, filas escritas)."""
    registros = sorted(registros, key=lambda x: (str(x[1].get('guardado', '')), x[0]))  # en el orden en que se guardaron
    doc = office.abrir(entrada)
    if doc is None:
        raise RuntimeError('LibreOffice no pudo abrir la planilla.')
    try:
        hoja = doc.Sheets.getByName(HOJA)
        comuna = doc.Sheets.getByName('Listas').getCellRangeByName('R5').getString()
        puntos = {f[0] for f in celdas(doc, 'ListaPuntos') if f[0]}
        tipos = {f[0]: f[1] for f in celdas(doc, 'TablaHechos') if f[0]}
        ejecuto = {f[0] for f in celdas(doc, 'ListaEjecuto') if f[0]}
        inicio = celdas(doc, 'INICIO_MIN')[0][0]
        coords = {}
        for f in doc.Sheets.getByName('Puntos').getCellRangeByName('A2:E300').getDataArray():
            if f[0] and isinstance(f[3], float) and isinstance(f[4], float) and (f[3] or f[4]):
                coords[f[0]] = (f[3], f[4])

        datos = [list(f) for f in hoja.getCellRangeByName('B%d:H%d' % (FILA_INICIO, FILA_FIN)).getDataArray()]
        usadas = [i for i, f in enumerate(datos) if any(v not in ('', None) for v in f)]
        siguiente = (usadas[-1] + 1) if usadas else 0
        hoy_serial = (hoy - FECHA_BASE).days

        resultados, escritas = [], []
        for nombre, r in registros:
            def resultado(estado, **extra):
                resultados.append(dict(registro=nombre, estado=estado, **extra))

            error = validar_formato(r)
            if error:
                resultado('rechazado', motivo=error)
                continue
            fecha = (datetime.date.fromisoformat(r['fecha']) - FECHA_BASE).days
            # Lo que la validación de datos de la planilla no dejaría escribir a una persona, tampoco se escribe aquí.
            motivo = (
                'El registro es de %s y esta planilla es de %s.' % (r['comuna'], comuna) if r['comuna'] != comuna else
                'Fecha anterior al inicio de obras.' if fecha < inicio else
                'Fecha futura.' if fecha > hoy_serial else
                'Punto fuera de la lista de la planilla.' if r['punto'] not in puntos else
                'Hecho fuera de la lista de la planilla.' if r['hecho'] not in tipos else
                'Ejecutó fuera de la lista de la planilla.' if r.get('ejecuto') and r['ejecuto'] not in ejecuto else
                None)
            if motivo:
                resultado('rechazado', motivo=motivo)
                continue

            def fila_con(condicion):
                for i in usadas:
                    if condicion(datos[i]):
                        return i
                return None

            ref = ref_de(r)
            previa = fila_con(lambda f: ref in str(f[4]))
            if previa is not None:
                resultado('ya_escrito', fila=FILA_INICIO + previa,
                          id=hoja.getCellByPosition(0, FILA_INICIO - 1 + previa).getString())
                continue
            if tipos[r['hecho']] == 'Etapa':
                previa = fila_con(lambda f: f[1] == r['punto'] and f[2] == r['hecho'] and f[6] != 'Anulada')
                if previa is not None:
                    resultado('etapa_ya_registrada', fila=FILA_INICIO + previa,
                              id=hoja.getCellByPosition(0, FILA_INICIO - 1 + previa).getString(),
                              motivo='La etapa ya está en otra fila; las fotos quedaron en Fotos.')
                    continue
            if siguiente >= len(datos):
                resultado('rechazado', motivo='La planilla no tiene filas libres.')
                continue

            fila = FILA_INICIO + siguiente  # 1-based
            valores = [fecha, r['punto'], r['hecho'], r.get('ejecuto') or '', detalle(r, coords.get(r['punto'])),
                       'Sí' if r.get('fotos') else '', '']
            hoja.getCellByPosition(1, fila - 1).setValue(fecha)
            for col, valor in enumerate(valores[1:6], start=2):
                if valor:
                    hoja.getCellByPosition(col, fila - 1).setString(valor)
            datos[siguiente] = valores
            usadas.append(siguiente)
            siguiente += 1
            escritas.append((len(resultados), fila))
            resultado('escrito', fila=fila)

        if escritas:
            doc.calculateAll()
            for i, fila in escritas:
                resultados[i]['id'] = hoja.getCellByPosition(0, fila - 1).getString()
                resultados[i]['control'] = hoja.getCellByPosition(9, fila - 1).getString()
                resultados[i]['nombre_foto'] = hoja.getCellByPosition(8, fila - 1).getString()
            doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(salida)), (prop('FilterName', FILTRO_XLSX),))
        return resultados, len(escritas)
    finally:
        doc.close(True)


# ---------------------------------------------------------------------------- Dropbox

class Dropbox:
    def __init__(self, cfg):
        self.key = os.environ.get('DROPBOX_APP_KEY') or cfg.get('app_key')
        self.secret = os.environ.get('DROPBOX_APP_SECRET') or cfg.get('app_secret')
        self.refresh = os.environ.get('DROPBOX_REFRESH_TOKEN') or cfg.get('refresh_token')
        if not (self.key and self.secret and self.refresh):
            raise RuntimeError('Faltan las credenciales de Dropbox (app_key, app_secret, refresh_token).')
        self.token = None
        self.raiz = None

    def _pedir(self, url, datos, cabeceras):
        req = urllib.request.Request(url, data=datos, headers=cabeceras, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                return resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            cuerpo = e.read().decode('utf-8', 'replace')
            raise DropboxError(e.code, cuerpo)

    def _token(self):
        if not self.token:
            datos = urllib.parse.urlencode({'grant_type': 'refresh_token', 'refresh_token': self.refresh,
                                            'client_id': self.key, 'client_secret': self.secret}).encode()
            cuerpo, _ = self._pedir('https://api.dropboxapi.com/oauth2/token', datos,
                                    {'Content-Type': 'application/x-www-form-urlencoded'})
            self.token = json.loads(cuerpo)['access_token']
            cuenta, _ = self._pedir('https://api.dropboxapi.com/2/users/get_current_account', None,
                                    {'Authorization': 'Bearer ' + self.token})
            self.raiz = json.loads(cuenta)['root_info']['root_namespace_id']
        return self.token

    def _cabeceras(self, extra):
        c = {'Authorization': 'Bearer ' + self._token(),
             'Dropbox-API-Path-Root': json.dumps({'.tag': 'root', 'root': self.raiz})}
        c.update(extra)
        return c

    def rpc(self, ruta, cuerpo):
        datos, _ = self._pedir('https://api.dropboxapi.com/2/' + ruta, json.dumps(cuerpo).encode(),
                               self._cabeceras({'Content-Type': 'application/json'}))
        return json.loads(datos) if datos else {}

    def descargar(self, ruta):
        datos, cab = self._pedir('https://content.dropboxapi.com/2/files/download', b'',
                                 self._cabeceras({'Dropbox-API-Arg': json.dumps({'path': ruta}),
                                                  'Content-Type': 'text/plain'}))
        meta = {k.lower(): v for k, v in cab.items()}.get('dropbox-api-result')
        return datos, json.loads(meta)

    def subir(self, ruta, datos, modo):
        arg = {'path': ruta, 'mode': modo, 'autorename': False, 'mute': True, 'strict_conflict': True}
        cuerpo, _ = self._pedir('https://content.dropboxapi.com/2/files/upload', datos,
                                self._cabeceras({'Dropbox-API-Arg': json.dumps(arg),
                                                 'Content-Type': 'application/octet-stream'}))
        return json.loads(cuerpo)

    def listar(self, carpeta):
        r = self.rpc('files/list_folder', {'path': carpeta, 'recursive': False})
        entradas = r['entries']
        while r.get('has_more'):
            r = self.rpc('files/list_folder/continue', {'cursor': r['cursor']})
            entradas += r['entries']
        return entradas

    def mover(self, origen, destino):
        return self.rpc('files/move_v2', {'from_path': origen, 'to_path': destino, 'autorename': True})


class DropboxError(Exception):
    def __init__(self, estado, cuerpo):
        super().__init__('Dropbox respondió %s: %s' % (estado, cuerpo[:300]))
        self.estado, self.cuerpo = estado, cuerpo


def planilla_abierta(dbx, ruta):
    carpeta, nombre = ruta.rsplit('/', 1)
    marcas = {'~$' + nombre, '~$' + nombre[2:], '.~lock.' + nombre + '#'}
    return [e['name'] for e in dbx.listar(carpeta) if e['name'] in marcas]


def procesar_comuna(dbx, office, comuna, cfg, trabajo, reposo_min, hoy):
    cola, ruta = cfg['cola'].rstrip('/'), cfg['planilla']
    try:
        archivos = [e for e in dbx.listar(cola) if e['.tag'] == 'file' and e['name'].lower().endswith('.json')]
    except DropboxError as e:
        if e.estado == 409 and 'not_found' in e.cuerpo:
            log('%s: la carpeta de cola todavía no existe (nadie ha enviado registros).' % comuna)
            return
        raise
    if not archivos:
        log('%s: sin registros en cola.' % comuna)
        return

    registros, malos = [], []
    for e in archivos:
        datos, _ = dbx.descargar(e['path_display'])
        try:
            registros.append((e['name'], json.loads(datos.decode('utf-8'))))
        except (ValueError, UnicodeDecodeError):
            malos.append(e['name'])

    meta = dbx.rpc('files/get_metadata', {'path': ruta})
    modificada = datetime.datetime.strptime(meta['server_modified'], '%Y-%m-%dT%H:%M:%SZ')
    minutos = (datetime.datetime.utcnow() - modificada).total_seconds() / 60
    if minutos < reposo_min:
        log('%s: la planilla cambió hace %d min; se espera a la próxima pasada.' % (comuna, minutos))
        return
    abiertas = planilla_abierta(dbx, ruta)
    if abiertas:
        log('%s: la planilla está abierta (%s); se espera a la próxima pasada.' % (comuna, ', '.join(abiertas)))
        return

    carpeta = os.path.join(trabajo, comuna)
    os.makedirs(carpeta, exist_ok=True)
    sello = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    datos, meta = dbx.descargar(ruta)
    entrada = os.path.join(carpeta, '%s_antes_%s.xlsx' % (sello, meta['rev']))
    salida = os.path.join(carpeta, '%s_despues.xlsx' % sello)
    with open(entrada, 'wb') as f:
        f.write(datos)

    resultados, escritas = procesar_planilla(office, entrada, salida, registros, hoy)
    resultados += [dict(registro=n, estado='rechazado', motivo='El archivo no es un JSON válido.') for n in malos]

    if escritas:
        try:
            with open(salida, 'rb') as f:
                subida = dbx.subir(ruta, f.read(), {'.tag': 'update', 'update': meta['rev']})
        except DropboxError as e:
            if e.estado == 409:
                log('%s: la planilla cambió durante la pasada; no se escribió nada. Se reintenta luego.' % comuna)
                return
            raise
        log('%s: %d fila(s) escrita(s); planilla en la revisión %s.' % (comuna, escritas, subida['rev']))

    for r in resultados:
        destino = 'rechazados' if r['estado'] == 'rechazado' else 'procesados'
        base = r['registro'][:-5]
        r['pasada'] = sello
        dbx.subir('%s/%s/%s.resultado.json' % (cola, destino, base),
                  json.dumps(r, ensure_ascii=False, indent=2).encode('utf-8'), {'.tag': 'add'})
        dbx.mover('%s/%s' % (cola, r['registro']), '%s/%s/%s' % (cola, destino, r['registro']))
        log('%s: %s → %s%s' % (comuna, r['registro'], r['estado'],
                               (' fila %s (%s) Control: %s' % (r['fila'], r.get('id', ''), r.get('control', '')))
                               if r.get('fila') else (' · ' + r.get('motivo', '')) if r.get('motivo') else ''))

    for viejo in sorted(glob.glob(os.path.join(carpeta, '*.xlsx')))[:-2 * RESPALDOS_LOCALES]:
        os.remove(viejo)  # copias locales de trabajo; Dropbox guarda el historial de versiones de la planilla


# ---------------------------------------------------------------------------- Entrada

def soffice_por_defecto():
    for c in (r'C:\Program Files\LibreOffice\program\soffice.exe',
              '/usr/bin/soffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'):
        if os.path.exists(c):
            return c
    return 'soffice'


def main():
    global LOG_PATH
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--config', help='Configuración con Dropbox y las planillas por comuna.')
    ap.add_argument('--planilla', help='Prueba local: copia de la planilla.')
    ap.add_argument('--cola', help='Prueba local: carpeta con los JSON de la app.')
    ap.add_argument('--salida', help='Prueba local: dónde guardar la planilla escrita.')
    ap.add_argument('--hoy', help='Prueba local: fecha de hoy (AAAA-MM-DD).')
    args = ap.parse_args()

    if args.planilla:
        if not (args.cola and args.salida):
            ap.error('La prueba local necesita --planilla, --cola y --salida.')
        hoy = datetime.date.fromisoformat(args.hoy) if args.hoy else datetime.date.today()
        registros = []
        for ruta in sorted(glob.glob(os.path.join(args.cola, '*.json'))):
            with open(ruta, encoding='utf-8') as f:
                registros.append((os.path.basename(ruta), json.load(f)))
        with Office(soffice_por_defecto()) as office:
            resultados, escritas = procesar_planilla(office, args.planilla, args.salida, registros, hoy)
        print(json.dumps(resultados, ensure_ascii=False, indent=2))
        print('%d fila(s) escrita(s)%s.' % (escritas, ' en ' + args.salida if escritas else ''))
        return

    if not args.config:
        ap.error('Indica --config, o --planilla/--cola/--salida para una prueba local.')
    with open(args.config, encoding='utf-8') as f:
        cfg = json.load(f)
    trabajo = cfg.get('carpeta_trabajo') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trabajo')
    os.makedirs(trabajo, exist_ok=True)
    LOG_PATH = os.path.join(trabajo, 'registro.log')
    dbx = Dropbox(cfg.get('dropbox', {}))
    hoy = datetime.date.today()
    fallas = 0
    with Office(cfg.get('soffice') or soffice_por_defecto()) as office:
        for comuna, c in cfg['comunas'].items():
            try:
                procesar_comuna(dbx, office, comuna, c, trabajo, cfg.get('minutos_de_reposo', 15), hoy)
            except Exception as e:  # una comuna con problemas no detiene a las otras
                fallas += 1
                log('%s: ERROR %s' % (comuna, e))
    sys.exit(1 if fallas else 0)


if __name__ == '__main__':
    main()
