"""Levantamiento en terreno: cola de Dropbox → base de datos → planillas (DEC-020 y vía rápida por comuna).

La app deja un JSON por punto y por envío. El más reciente de cada punto queda vigente y se escribe en las columnas
amarillas de su fila, buscadas por el nombre del encabezado (nunca por la posición), tal como dice el contrato que se
generó desde las mismas planillas. Las columnas calculadas («Control», «Trámite resultante», ángulos LPR) las sigue
calculando la planilla; el servicio solo las lee para guardarlas. Una fila que alguien cambió a mano desde la última
generación no se pisa: queda un aviso hasta que se decida con --forzar.

Configuración, en proyecto.json:
    "levantamiento": {"cola": "/…/Común/Cola levantamiento",
                      "planillas": {"DEC-020": "/…/formulario.xlsx", "VR-Antofagasta": "/…/…_Antofagasta.xlsx", …}}
Por compatibilidad, PARTE_LEVANTAMIENTO_COLA y PARTE_LEVANTAMIENTO_PLANILLA (la de DEC-020) en .env también sirven.
Un formulario sin planilla configurada recibe los envíos en la base, pero no escribe nada."""
import datetime
import json
import logging
import os
import urllib.parse

from psycopg.types.json import Jsonb

from . import correo, db
from .dropbox import DropboxError
from .generar import planilla_en_uso
from .planilla import FECHA_BASE, sin_proteccion

log = logging.getLogger('parte.levantamiento')
VERSION = 2
CONTRATO = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'levantamiento_contrato.json'), encoding='utf-8'))
FORMULARIOS = {f['id']: f for f in CONTRATO['formularios']}
PUNTOS = {p['codigo']: (f, p) for f in CONTRATO['formularios'] for p in f['puntos']}
CODIGO, CONTROL, TRAMITE = 'Código', 'Control', 'Trámite resultante'


def config():
    p = correo.proyecto() or {}
    lev = p.get('levantamiento') or {}
    planillas = dict(lev.get('planillas') or {})
    if os.environ.get('PARTE_LEVANTAMIENTO_PLANILLA') and 'DEC-020' not in planillas:
        planillas['DEC-020'] = os.environ['PARTE_LEVANTAMIENTO_PLANILLA']
    return {'cola': lev.get('cola') or os.environ.get('PARTE_LEVANTAMIENTO_COLA') or '', 'planillas': planillas}


def configurado():
    return bool(config()['cola'])


def migrar(conn):
    """Lo guardado con la primera versión (solo DEC-020, valores por letra de columna) pasa a la v2 por encabezado."""
    letra = {c['col']: c['key'] for c in FORMULARIOS['DEC-020']['campos']}
    for r in conn.execute('SELECT codigo, valores FROM levantamientos WHERE formulario IS NULL').fetchall():
        valores = {letra.get(k, k): v for k, v in r['valores'].items()}
        conn.execute("UPDATE levantamientos SET formulario='DEC-020', valores=%s WHERE codigo=%s", (Jsonb(valores), r['codigo']))
    conn.execute('''INSERT INTO planillas_levantamiento (formulario, rev_generada, generada_en, filas_generadas, ultimo_aviso)
                    SELECT 'DEC-020', rev_generada, generada_en, filas_generadas, ultimo_aviso FROM planilla_levantamiento
                    ON CONFLICT (formulario) DO NOTHING''')
    conn.commit()


# --- Validación del envío contra el contrato -------------------------------------------------------------------

def valor_valido(campo, v):
    """El valor normalizado para guardar, o lanza ValueError con el motivo."""
    if v is None or v == '':
        return None
    t = campo['type']
    if t == 'date':
        fecha = datetime.date.fromisoformat(str(v))
        if (fecha - FECHA_BASE).days < int(float(CONTRATO['fechaMinima'])):
            raise ValueError('fecha anterior a la permitida por el formulario')
        return fecha.isoformat()
    if t in ('decimal', 'whole'):
        n = float(v)
        if t == 'whole' and (n != int(n) or n < 0):
            raise ValueError('debe ser un entero mayor o igual a 0')
        if t == 'decimal' and n < -1000:
            raise ValueError('valor fuera de rango')
        return int(n) if t == 'whole' else n
    if t == 'list':
        if v not in campo['options']:
            raise ValueError('«%s» no está en la lista' % v)
        return v
    s = str(v).strip()
    if len(s) > 2000:
        raise ValueError('texto demasiado largo')
    return s or None


def validar(r, comuna):
    """(motivo, valores normalizados). motivo es None si el envío es válido."""
    if not isinstance(r, dict) or r.get('version') != VERSION or r.get('tipo') not in ('levantamiento', 'anulacion'):
        return 'Versión de envío no reconocida.', None
    for campo in ('id', 'formulario', 'codigo', 'comuna', 'guardado'):
        if not isinstance(r.get(campo), str) or not r[campo].strip():
            return 'Falta el campo «%s».' % campo, None
    if r['codigo'] not in PUNTOS or PUNTOS[r['codigo']][0]['id'] != r['formulario']:
        return 'El punto %s no está en el formulario %s.' % (r['codigo'], r['formulario']), None
    f, punto = PUNTOS[r['codigo']]
    if r['comuna'] != comuna or punto['comuna'] != comuna:
        return 'El punto %s es de %s y esta cola es de %s.' % (r['codigo'], punto['comuna'], comuna), None
    try:
        datetime.datetime.fromisoformat(r['guardado'].replace('Z', '+00:00'))
    except ValueError:
        return 'Fecha de guardado no válida.', None
    if r['tipo'] == 'anulacion':
        motivo = r.get('motivo')
        if not isinstance(motivo, str) or not motivo.strip() or len(motivo) > 500:
            return 'Una anulación necesita un motivo (hasta 500 caracteres).', None
        return None, {}
    campos = {c['key']: c for c in f['campos']}
    valores, errores = {}, []
    for clave, v in (r.get('valores') or {}).items():
        if clave not in campos:
            errores.append('«%s»: campo que no está en el contrato' % clave)
            continue
        try:
            n = valor_valido(campos[clave], v)
        except (ValueError, TypeError) as e:
            errores.append('«%s»: %s' % (clave, e))
            continue
        if n is not None:
            valores[clave] = n
    if errores:
        return 'Valores no válidos: ' + '; '.join(errores), None
    return None, valores


# --- Cola → base de datos ---------------------------------------------------------------------------------------

def ingestar(dbx, conn):
    base = config()['cola'].rstrip('/')
    nuevos = 0
    for comuna in sorted({p['comuna'] for _, p in PUNTOS.values()}):
        cola = '%s/%s' % (base, comuna)
        try:
            archivos = [e for e in dbx.listar(cola) if e['.tag'] == 'file' and e['name'].lower().endswith('.json')]
        except DropboxError as e:
            if e.es('not_found'):
                continue
            raise
        for e in sorted(archivos, key=lambda x: x['name']):
            nombre, ruta = e['name'], e['path_display']
            datos, _ = dbx.descargar(ruta)
            try:
                r = json.loads(datos.decode('utf-8'))
                motivo, valores = validar(r, comuna)
            except (ValueError, UnicodeDecodeError):
                r, motivo, valores = None, 'El archivo no es un JSON válido.', None
            if motivo:
                resultado, destino = {'estado': 'rechazado', 'motivo': motivo}, 'rechazados'
                db.evento(conn, 'levantamiento_rechazado', comuna, r.get('codigo') if isinstance(r, dict) else None,
                          archivo=nombre, motivo=motivo)
            else:
                resultado, destino = recibir(conn, r, comuna, valores), 'procesados'
                nuevos += resultado['estado'] == 'vigente'
            conn.commit()
            resultado['procesado'] = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
            dbx.subir('%s/%s/%s.resultado.json' % (cola, destino, nombre[:-5]),
                      json.dumps(resultado, ensure_ascii=False, indent=1).encode('utf-8'), 'overwrite', sobrescribir=True)
            dbx.mover(ruta, '%s/%s/%s' % (cola, destino, nombre))
            log.info('Levantamiento %s: %s → %s%s', comuna, nombre, resultado['estado'],
                     ' · ' + resultado['motivo'] if 'motivo' in resultado else '')
    return nuevos


def recibir(conn, r, comuna, valores):
    """Guarda el envío y, si es el más reciente del punto, lo deja vigente. Nada se borra: una anulación es un envío más,
    que deja el punto sin valores (la fila de la planilla vuelve a quedar vacía) y guarda el motivo."""
    anulacion = r['tipo'] == 'anulacion'
    if conn.execute('SELECT 1 FROM levantamiento_envios WHERE id=%s', (r['id'],)).fetchone():
        return {'estado': 'ya_recibido', 'codigo': r['codigo']}
    guardado = datetime.datetime.fromisoformat(r['guardado'].replace('Z', '+00:00'))
    actual = conn.execute('SELECT envio_id, guardado_en FROM levantamientos WHERE codigo=%s', (r['codigo'],)).fetchone()
    if actual and actual['guardado_en'] > guardado:
        estado = 'anterior'   # llegó tarde un envío más viejo que el vigente: se guarda, pero no se aplica
    else:
        estado = 'vigente'
        if actual:
            conn.execute("UPDATE levantamiento_envios SET estado='reemplazado' WHERE id=%s", (actual['envio_id'],))
        conn.execute('''INSERT INTO levantamientos (codigo, formulario, comuna, valores, fotos, gps, gps_poste, registrado_por, envio_id, guardado_en,
                          anulado, motivo_anulacion)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (codigo) DO UPDATE SET formulario=EXCLUDED.formulario, valores=EXCLUDED.valores, fotos=EXCLUDED.fotos,
                          gps=EXCLUDED.gps, gps_poste=EXCLUDED.gps_poste, registrado_por=EXCLUDED.registrado_por,
                          envio_id=EXCLUDED.envio_id, guardado_en=EXCLUDED.guardado_en, anulado=EXCLUDED.anulado,
                          motivo_anulacion=EXCLUDED.motivo_anulacion, actualizado_en=clock_timestamp()''',
                     (r['codigo'], r['formulario'], comuna, Jsonb(valores), Jsonb([] if anulacion else r.get('fotos') or []),
                      Jsonb(r.get('gps')) if r.get('gps') and not anulacion else None,
                      Jsonb(r.get('gpsPosteCGE')) if r.get('gpsPosteCGE') and not anulacion else None,
                      r.get('registro') or None, r['id'], guardado, anulacion, r['motivo'].strip() if anulacion else None))
    conn.execute('INSERT INTO levantamiento_envios (id, codigo, contenido, estado) VALUES (%s,%s,%s,%s)',
                 (r['id'], r['codigo'], Jsonb(r), estado))
    detalle = {'motivo': r['motivo'].strip()} if anulacion else {}
    db.evento(conn, 'levantamiento_' + ('anulacion_' if anulacion else '') + estado, comuna, r['codigo'], r.get('registro'),
              envio=r['id'], formulario=r['formulario'], **detalle)
    return {'estado': estado, 'codigo': r['codigo'], **({'anulacion': True} if anulacion else {})}


# --- Base de datos → planilla -----------------------------------------------------------------------------------

def estado(conn, formulario):
    return conn.execute('SELECT * FROM planillas_levantamiento WHERE formulario=%s', (formulario,)).fetchone() or {
        'rev_generada': None, 'generada_en': None, 'filas_generadas': None, 'ultimo_aviso': None}


def pendiente(conn, formulario):
    m = conn.execute('SELECT MAX(actualizado_en) AS m FROM levantamientos WHERE formulario=%s', (formulario,)).fetchone()['m']
    e = estado(conn, formulario)
    return m is not None and (e['generada_en'] is None or m > e['generada_en'])


def celda(campo, v):
    """Lo que se escribe en la celda, del mismo tipo que devuelve UNO al leerla: número o texto."""
    if v is None or v == '':
        return ''
    if campo['type'] == 'date':
        return float((datetime.date.fromisoformat(v) - FECHA_BASE).days)
    if campo['type'] in ('decimal', 'whole'):
        return float(v)
    return str(v)


def avisar(dbx, conn, formulario, texto):
    if estado(conn, formulario)['ultimo_aviso'] == texto:
        return
    log.warning('Levantamiento %s: %s', formulario, texto)
    db.evento(conn, 'levantamiento_aviso', detalle=texto, formulario=formulario)
    conn.execute('''INSERT INTO planillas_levantamiento (formulario, ultimo_aviso) VALUES (%s, %s)
                    ON CONFLICT (formulario) DO UPDATE SET ultimo_aviso=EXCLUDED.ultimo_aviso''', (formulario, texto))
    conn.commit()
    correo.avisar_falla(conn, 'LEVANTAMIENTO ' + formulario, texto)
    ruta = '%s/AVISOS/Levantamiento_%s_%s.txt' % (config()['cola'].rstrip('/'), formulario, datetime.datetime.now().strftime('%Y-%m-%d_%H%M'))
    try:
        dbx.subir(ruta, (texto + '\n').encode('utf-8'), 'overwrite', sobrescribir=True)
    except DropboxError as err:
        log.error('No se pudo dejar el aviso en Dropbox: %s', err)


def url_carpeta(ruta):
    return 'https://www.dropbox.com/home' + urllib.parse.quote(ruta.rsplit('/', 1)[0])


def encabezados(hoja, fila):
    """{encabezado: columna 0-based} de la fila de encabezados; termina tras cinco celdas vacías seguidas."""
    out, vacias, c = {}, 0, 0
    while vacias < 5:
        texto = hoja.getCellByPosition(c, fila - 1).getString().strip()
        if texto:
            out.setdefault(texto, c)
            vacias = 0
        else:
            vacias += 1
        c += 1
    return out


def _valor(hoja, col, fila0):
    """El valor de una celda: número, texto o '' si está vacía."""
    cel = hoja.getCellByPosition(col, fila0)
    tipo = cel.getType().value
    if tipo == 'EMPTY':
        return ''
    return cel.getValue() if tipo == 'VALUE' else cel.getString()


def generar(dbx, office, conn, formulario, trabajo, reposo_min=10, forzar=()):
    """Escribe los levantamientos vigentes de un formulario en su planilla. Devuelve True si quedó actualizada en Dropbox.

    forzar: códigos cuya fila se reescribe aunque alguien la haya cambiado a mano."""
    f = FORMULARIOS[formulario]
    ruta = config()['planillas'].get(formulario)
    if not ruta:
        return False
    meta = dbx.metadata(ruta)
    minutos = (datetime.datetime.utcnow() - datetime.datetime.strptime(meta['server_modified'], '%Y-%m-%dT%H:%M:%SZ')).total_seconds() / 60
    e = estado(conn, formulario)
    if minutos < reposo_min and meta['rev'] != e['rev_generada'] and not forzar:
        log.info('Levantamiento %s: la planilla cambió hace %d min; se espera.', formulario, minutos)
        return False
    en_uso = planilla_en_uso(dbx, ruta)
    if en_uso and not forzar:
        log.info('Levantamiento %s: la planilla está abierta (%s); se espera.', formulario, ', '.join(en_uso))
        return False

    carpeta = os.path.join(trabajo, 'levantamiento', formulario)
    os.makedirs(carpeta, exist_ok=True)
    sello = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    datos, meta = dbx.descargar(ruta)
    entrada, salida = os.path.join(carpeta, '%s_antes.xlsx' % sello), os.path.join(carpeta, '%s_despues.xlsx' % sello)
    with open(entrada, 'wb') as fh:
        fh.write(datos)

    vigentes = {r['codigo']: r for r in conn.execute('SELECT * FROM levantamientos WHERE formulario=%s', (formulario,)).fetchall()}
    base = e['filas_generadas'] or {}
    campos = f['campos']
    escrito, tocadas, faltan, leidos, malas = {}, [], set(vigentes), {}, []
    doc = office.abrir(entrada)
    try:
        for nombre_hoja in f['hojas']:
            if not doc.Sheets.hasByName(nombre_hoja):
                malas.append(nombre_hoja)
                continue
            hoja = doc.Sheets.getByName(nombre_hoja)
            enc = encabezados(hoja, f['filaEncabezado'])
            if CODIGO not in enc or any(c['key'] not in enc for c in campos):
                malas.append(nombre_hoja)
                continue
            cols = [enc[c['key']] for c in campos]
            filas, fila = {}, f['filaInicio']
            while hoja.getCellByPosition(enc[CODIGO], fila - 1).getString():
                filas[hoja.getCellByPosition(enc[CODIGO], fila - 1).getString()] = fila
                fila += 1
            presentes = [c for c in vigentes if c in filas]
            faltan -= set(presentes)
            with sin_proteccion(hoja):
                for codigo in presentes:
                    fila0 = filas[codigo] - 1
                    actual = [_valor(hoja, c, fila0) for c in cols]
                    esperado = [celda(c, vigentes[codigo]['valores'].get(c['key'])) for c in campos]
                    previo = base.get(codigo)
                    a_mano = actual != previo if previo is not None else any(v != '' for v in actual)
                    if a_mano and actual != esperado and codigo not in forzar:
                        tocadas.append(codigo)
                        continue
                    for col, v in zip(cols, esperado):
                        cel = hoja.getCellByPosition(col, fila0)
                        if isinstance(v, float):
                            cel.setValue(v)
                        elif v:
                            cel.setString(v)
                        elif cel.getType().value != 'EMPTY':
                            cel.setFormula('')
                    if f.get('columnaFotos'):
                        _enlace_fotos(hoja, enc, f, fila0, vigentes[codigo]['fotos'] or [])
                    escrito[codigo] = esperado
                    leidos[codigo] = (hoja, fila0, enc)
        doc.calculateAll()
        calculado = {codigo: {k: (hoja.getCellByPosition(enc[k], fila0).getString() if k in enc else None) for k in (CONTROL, TRAMITE)}
                     for codigo, (hoja, fila0, enc) in leidos.items()}
        if escrito:
            office.guardar_xlsx(doc, salida)
    finally:
        doc.close(True)

    if escrito:
        with open(salida, 'rb') as fh:
            try:
                subida = dbx.subir(ruta, fh.read(), {'.tag': 'update', 'update': meta['rev']})
            except DropboxError as err:
                if err.estado == 409:
                    log.info('Levantamiento %s: la planilla cambió durante la generación; se reintenta en el próximo ciclo.', formulario)
                    conn.rollback()
                    return False
                raise
        rev = subida['rev']
    else:
        rev = meta['rev']   # nada que escribir: la planilla queda como está, pero el pendiente se da por revisado
    conn.execute('''INSERT INTO planillas_levantamiento (formulario, rev_generada, generada_en, filas_generadas) VALUES (%s, %s, clock_timestamp(), %s)
                    ON CONFLICT (formulario) DO UPDATE SET rev_generada=EXCLUDED.rev_generada, generada_en=EXCLUDED.generada_en,
                      filas_generadas=EXCLUDED.filas_generadas''', (formulario, rev, Jsonb({**base, **escrito})))
    for codigo, c in calculado.items():
        conn.execute('UPDATE levantamientos SET control=%s, tramite=%s WHERE codigo=%s', (c[CONTROL], c[TRAMITE] or None, codigo))
    db.evento(conn, 'levantamiento_generado', rev=rev, filas=len(escrito), formulario=formulario, forzadas=list(forzar))
    conn.commit()
    log.info('Levantamiento %s: planilla actualizada con %d punto(s); revisión %s.', formulario, len(escrito), rev)
    if malas:
        avisar(dbx, conn, formulario, 'La(s) hoja(s) %s no existen o no tienen los encabezados del contrato; no se escribieron. '
               'Si se cambió la planilla, hay que regenerar el contrato.' % ', '.join('«%s»' % h for h in malas))
    if tocadas:
        avisar(dbx, conn, formulario, 'Las filas de %s fueron cambiadas a mano y no se reescribieron. Para que prevalezca lo '
               'enviado desde la app: parte levantamiento --forzar %s' % (', '.join(tocadas), ' '.join(tocadas)))
    if faltan:
        avisar(dbx, conn, formulario, 'Hay levantamientos de puntos que no están en la planilla: %s.' % ', '.join(sorted(faltan)))
    for viejo in sorted(x for x in os.listdir(carpeta) if x.endswith('.xlsx'))[:-20]:
        os.remove(os.path.join(carpeta, viejo))
    return True


def _enlace_fotos(hoja, enc, f, fila0, fotos):
    """DEC-020 lleva una columna del sistema, a la derecha de la última, con el enlace a la carpeta de fotos del punto."""
    nombre = f['columnaFotos']
    if nombre not in enc:
        col = max(enc.values()) + 1
        encabezado = hoja.getCellByPosition(col, f['filaEncabezado'] - 1)
        hoja.copyRange(encabezado.CellAddress, hoja.getCellByPosition(enc[CONTROL], f['filaEncabezado'] - 1).RangeAddress)
        encabezado.setString(nombre)
        enc[nombre] = col
    fotos = [x for x in fotos if x.get('ruta')]
    cel = hoja.getCellByPosition(enc[nombre], fila0)
    if fotos:
        cel.setFormula('=HYPERLINK("%s";"%d foto%s")' % (url_carpeta(fotos[0]['ruta']), len(fotos), '' if len(fotos) == 1 else 's'))
    elif cel.getType().value != 'EMPTY':
        cel.setFormula('')   # punto anulado: las fotos siguen en Dropbox, pero la fila ya no las enlaza


def pasada(dbx, office, conn, trabajo, reposo_min=10, forzar=()):
    if not configurado():
        return
    ingestar(dbx, conn)
    for formulario in FORMULARIOS:
        if formulario in config()['planillas'] and (forzar or pendiente(conn, formulario)):
            try:
                generar(dbx, office, conn, formulario, trabajo, reposo_min, forzar)
            except Exception:
                conn.rollback()
                log.exception('Levantamiento %s: la generación falló; se reintenta en el próximo ciclo.', formulario)
