"""Fibra óptica, levantamiento de ruta y apoyos: cola de Dropbox → base de datos → planilla «Tendido FO» de la comuna.

La app deja un JSON por registro (una fila de «Ruta» o de «Apoyos») y por envío. El más reciente de cada registro
queda vigente y se escribe en las columnas amarillas de su fila, buscadas por el encabezado; las columnas calculadas
(«Control», «Veredicto», «Permisos del tramo», conteos de apoyos) las sigue calculando la planilla y el servicio solo
las lee para guardarlas. Una fila cambiada a mano desde la última generación no se pisa: queda un aviso.

Códigos NC (postes que no están en el catastro): la app toma el siguiente libre que conoce. Si dos teléfonos tomaron
el mismo código para postes distintos (registros con distinto «registroId»), el segundo recibe el siguiente código NC
libre al llegar, se le avisa a la oficina y el resultado del envío lo dice.

Configuración, en proyecto.json:
    "fibra": {"planillas": {"Antofagasta": "/…/2026-11-06_Tendido_FO_Antofagasta.xlsx", "Calama": "…", "Tocopilla": "…"}}
La cola es «Fibra/<Comuna>» dentro de la cola del levantamiento. Una comuna sin planilla recibe los envíos en la base,
pero no escribe nada."""
import datetime
import json
import logging
import os

from psycopg.types.json import Jsonb

from . import correo, db
from .dropbox import DropboxError
from .generar import planilla_en_uso
from .levantamiento import config as config_levantamiento, encabezados, _valor
from .planilla import FECHA_BASE, sin_proteccion

log = logging.getLogger('parte.fibra')
VERSION = 1
AQUI = os.path.dirname(os.path.abspath(__file__))
COMUNAS = ['Antofagasta', 'Calama', 'Tocopilla']
HOJAS_LEVANTAMIENTO = ['Ruta', 'Apoyos']
CONTRATOS = {}


def contrato(comuna):
    if comuna not in CONTRATOS:
        with open(os.path.join(AQUI, 'fibra_%s.json' % comuna), encoding='utf-8') as fh:
            c = json.load(fh)
        c['_codigos'] = {h: {str(f[1 + H['fijas'].index(H['codigo'])]) for f in H['filas']} for h, H in c['hojas'].items()}
        c['_nc'] = [str(f[1 + c['hojas']['Apoyos']['fijas'].index(c['hojas']['Apoyos']['codigo'])])
                    for f in c['hojas']['Apoyos']['filas'] if '-NC-' in str(f[1 + c['hojas']['Apoyos']['fijas'].index(c['hojas']['Apoyos']['codigo'])])]
        CONTRATOS[comuna] = c
    return CONTRATOS[comuna]


def config():
    p = correo.proyecto() or {}
    base = config_levantamiento()['cola'].rstrip('/')
    return {'cola': base + '/Fibra' if base else '', 'planillas': dict((p.get('fibra') or {}).get('planillas') or {})}


def configurado():
    return bool(config()['cola'])


# --- Validación ------------------------------------------------------------------------------------------------------

def valor_valido(campo, v):
    if v is None or v == '':
        return None
    t = campo['type']
    if t == 'date':
        return datetime.date.fromisoformat(str(v)).isoformat()
    if t in ('decimal', 'whole'):
        n = float(v)
        if t == 'whole' and (n != int(n) or n < 0):
            raise ValueError('debe ser un entero mayor o igual a 0')
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
    """(motivo, valores normalizados). Solo se aceptan las columnas amarillas de la hoja del registro."""
    if not isinstance(r, dict) or r.get('version') != VERSION or r.get('tipo') != 'fibra':
        return 'Versión de envío no reconocida.', None
    for campo in ('id', 'hoja', 'codigo', 'comuna', 'guardado', 'registroId'):
        if not isinstance(r.get(campo), str) or not r[campo].strip():
            return 'Falta el campo «%s».' % campo, None
    if r['comuna'] != comuna:
        return 'El envío es de %s y esta cola es de %s.' % (r['comuna'], comuna), None
    if r['hoja'] not in HOJAS_LEVANTAMIENTO:
        return 'La hoja «%s» no se recibe por esta cola.' % r['hoja'], None
    c = contrato(comuna)
    if r['codigo'] not in c['_codigos'][r['hoja']]:
        return 'El código %s no está en la hoja «%s» de %s.' % (r['codigo'], r['hoja'], comuna), None
    try:
        datetime.datetime.fromisoformat(r['guardado'].replace('Z', '+00:00'))
    except ValueError:
        return 'Fecha de guardado no válida.', None
    campos = {x['key']: x for x in c['hojas'][r['hoja']]['campos'] if x['rol'] == 'amarillo'}
    valores, errores = {}, []
    for clave, v in (r.get('valores') or {}).items():
        if clave not in campos:
            errores.append('«%s»: no es una columna que se llene en terreno' % clave)
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


# --- Cola → base de datos ---------------------------------------------------------------------------------------------

def ingestar(dbx, conn):
    base = config()['cola']
    for comuna in COMUNAS:
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
                db.evento(conn, 'fibra_rechazado', comuna, r.get('codigo') if isinstance(r, dict) else None, archivo=nombre, motivo=motivo)
            else:
                resultado, destino = recibir(dbx, conn, r, comuna, valores), 'procesados'
            conn.commit()
            resultado['procesado'] = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
            dbx.subir('%s/%s/%s.resultado.json' % (cola, destino, nombre[:-5]),
                      json.dumps(resultado, ensure_ascii=False, indent=1).encode('utf-8'), 'overwrite', sobrescribir=True)
            dbx.mover(ruta, '%s/%s/%s' % (cola, destino, nombre))
            log.info('Fibra %s: %s → %s%s', comuna, nombre, resultado['estado'], ' · ' + resultado['motivo'] if 'motivo' in resultado else '')


def codigo_nc(conn, comuna, codigo, registro_id):
    """El código NC que corresponde al registro: el pedido si está libre o ya es suyo; si no, el siguiente libre."""
    dueno = conn.execute('SELECT registro_id FROM fibra_nc WHERE comuna=%s AND codigo=%s', (comuna, codigo)).fetchone()
    if dueno is None or dueno['registro_id'] == registro_id:
        if dueno is None:
            conn.execute('INSERT INTO fibra_nc (comuna, codigo, registro_id) VALUES (%s,%s,%s)', (comuna, codigo, registro_id))
        return codigo
    propio = conn.execute('SELECT codigo FROM fibra_nc WHERE comuna=%s AND registro_id=%s', (comuna, registro_id)).fetchone()
    if propio:
        return propio['codigo']
    usados = {x['codigo'] for x in conn.execute('SELECT codigo FROM fibra_nc WHERE comuna=%s', (comuna,)).fetchall()}
    libre = next((c for c in contrato(comuna)['_nc'] if c not in usados), None)
    if libre is None:
        raise ValueError('No quedan códigos NC libres en la planilla de %s.' % comuna)
    conn.execute('INSERT INTO fibra_nc (comuna, codigo, registro_id) VALUES (%s,%s,%s)', (comuna, libre, registro_id))
    return libre


def recibir(dbx, conn, r, comuna, valores):
    """Guarda el envío y, si es el más reciente del registro, lo deja vigente. Nada se borra."""
    if conn.execute('SELECT 1 FROM fibra_envios WHERE id=%s', (r['id'],)).fetchone():
        return {'estado': 'ya_recibido', 'codigo': r['codigo']}
    codigo, extra = r['codigo'], {}
    if r['hoja'] == 'Apoyos' and '-NC-' in codigo:
        try:
            codigo = codigo_nc(conn, comuna, codigo, r['registroId'])
        except ValueError as e:
            return {'estado': 'rechazado', 'motivo': str(e)}
        if codigo != r['codigo']:
            extra = {'codigo_pedido': r['codigo'], 'codigo_asignado': codigo}
            avisar(dbx, conn, comuna, 'Dos registros tomaron el código %s para postes distintos; el de %s quedó como %s.'
                   % (r['codigo'], r.get('registro') or 'sin autor', codigo))
    guardado = datetime.datetime.fromisoformat(r['guardado'].replace('Z', '+00:00'))
    clave = '%s|%s|%s' % (comuna, r['hoja'], codigo)
    actual = conn.execute('SELECT envio_id, guardado_en FROM fibra_registros WHERE clave=%s', (clave,)).fetchone()
    if actual and actual['guardado_en'] > guardado:
        estado = 'anterior'
    else:
        estado = 'vigente'
        if actual:
            conn.execute("UPDATE fibra_envios SET estado='reemplazado' WHERE id=%s", (actual['envio_id'],))
        conn.execute('''INSERT INTO fibra_registros (clave, comuna, hoja, codigo, valores, fotos, gps, registrado_por, registro_id, envio_id, guardado_en)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (clave) DO UPDATE SET valores=EXCLUDED.valores, fotos=EXCLUDED.fotos, gps=EXCLUDED.gps,
                          registrado_por=EXCLUDED.registrado_por, registro_id=EXCLUDED.registro_id, envio_id=EXCLUDED.envio_id,
                          guardado_en=EXCLUDED.guardado_en, actualizado_en=clock_timestamp()''',
                     (clave, comuna, r['hoja'], codigo, Jsonb(valores), Jsonb(r.get('fotos') or []), Jsonb(r['gps']) if r.get('gps') else None,
                      r.get('registro') or None, r['registroId'], r['id'], guardado))
    conn.execute('INSERT INTO fibra_envios (id, comuna, hoja, codigo, contenido, estado) VALUES (%s,%s,%s,%s,%s,%s)',
                 (r['id'], comuna, r['hoja'], codigo, Jsonb(r), estado))
    db.evento(conn, 'fibra_' + estado, comuna, codigo, r.get('registro'), envio=r['id'], hoja=r['hoja'], **extra)
    return {'estado': estado, 'codigo': codigo, **extra}


# --- Base de datos → planilla -----------------------------------------------------------------------------------------

def estado(conn, comuna):
    return conn.execute('SELECT * FROM planillas_fibra WHERE comuna=%s', (comuna,)).fetchone() or {
        'rev_generada': None, 'generada_en': None, 'filas_generadas': None, 'ultimo_aviso': None}


def pendiente(conn, comuna):
    m = conn.execute('SELECT MAX(actualizado_en) AS m FROM fibra_registros WHERE comuna=%s', (comuna,)).fetchone()['m']
    e = estado(conn, comuna)
    return m is not None and (e['generada_en'] is None or m > e['generada_en'])


def celda(campo, v):
    if v is None or v == '':
        return ''
    if campo['type'] == 'date':
        return float((datetime.date.fromisoformat(v) - FECHA_BASE).days)
    if campo['type'] in ('decimal', 'whole'):
        return float(v)
    return str(v)


def avisar(dbx, conn, comuna, texto):
    if estado(conn, comuna)['ultimo_aviso'] == texto:
        return
    log.warning('Fibra %s: %s', comuna, texto)
    db.evento(conn, 'fibra_aviso', comuna, detalle=texto)
    conn.execute('''INSERT INTO planillas_fibra (comuna, ultimo_aviso) VALUES (%s, %s)
                    ON CONFLICT (comuna) DO UPDATE SET ultimo_aviso=EXCLUDED.ultimo_aviso''', (comuna, texto))
    correo.avisar_falla(conn, 'FIBRA ' + comuna.upper(), texto)
    ruta = '%s/AVISOS/Fibra_%s_%s.txt' % (config()['cola'], comuna, datetime.datetime.now().strftime('%Y-%m-%d_%H%M%S'))
    try:
        dbx.subir(ruta, (texto + '\n').encode('utf-8'), 'overwrite', sobrescribir=True)
    except DropboxError as err:
        log.error('No se pudo dejar el aviso en Dropbox: %s', err)


def filas_por_codigo(hoja, col_codigo, fila_inicio):
    """{código: fila (1-based)} leyendo la columna de códigos de una vez (Apoyos tiene miles de filas)."""
    usado = hoja.createCursor()
    usado.gotoEndOfUsedArea(False)
    ultima = usado.RangeAddress.EndRow
    if ultima < fila_inicio - 1:
        return {}
    datos = hoja.getCellRangeByPosition(col_codigo, fila_inicio - 1, col_codigo, ultima).getDataArray()
    out = {}
    for i, (v,) in enumerate(datos):
        if v in ('', None):
            break
        out[str(int(v)) if isinstance(v, float) and v == int(v) else str(v)] = fila_inicio + i
    return out


def generar(dbx, office, conn, comuna, trabajo, reposo_min=10, forzar=()):
    """Escribe los registros vigentes de la comuna en su planilla. Devuelve True si quedó actualizada en Dropbox."""
    c, ruta = contrato(comuna), config()['planillas'].get(comuna)
    if not ruta:
        return False
    meta = dbx.metadata(ruta)
    minutos = (datetime.datetime.utcnow() - datetime.datetime.strptime(meta['server_modified'], '%Y-%m-%dT%H:%M:%SZ')).total_seconds() / 60
    e = estado(conn, comuna)
    if minutos < reposo_min and meta['rev'] != e['rev_generada'] and not forzar:
        log.info('Fibra %s: la planilla cambió hace %d min; se espera.', comuna, minutos)
        return False
    en_uso = planilla_en_uso(dbx, ruta)
    if en_uso and not forzar:
        log.info('Fibra %s: la planilla está abierta (%s); se espera.', comuna, ', '.join(en_uso))
        return False

    carpeta = os.path.join(trabajo, 'fibra', comuna)
    os.makedirs(carpeta, exist_ok=True)
    sello = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    datos, meta = dbx.descargar(ruta)
    entrada, salida = os.path.join(carpeta, '%s_antes.xlsx' % sello), os.path.join(carpeta, '%s_despues.xlsx' % sello)
    with open(entrada, 'wb') as fh:
        fh.write(datos)

    vigentes = conn.execute('SELECT * FROM fibra_registros WHERE comuna=%s', (comuna,)).fetchall()
    base = e['filas_generadas'] or {}
    escrito, tocadas, faltan, malas, leidos = {}, [], [], [], {}
    doc = office.abrir(entrada)
    try:
        for nombre in HOJAS_LEVANTAMIENTO:
            regs = [r for r in vigentes if r['hoja'] == nombre]
            if not regs:
                continue
            H = c['hojas'][nombre]
            if not doc.Sheets.hasByName(nombre):
                malas.append(nombre)
                continue
            hoja = doc.Sheets.getByName(nombre)
            enc = encabezados(hoja, c['filaEncabezado'])
            campos = [x for x in H['campos'] if x['rol'] == 'amarillo']
            if H['codigo'] not in enc or any(x['key'] not in enc for x in campos):
                malas.append(nombre)
                continue
            cols = [enc[x['key']] for x in campos]
            filas = filas_por_codigo(hoja, enc[H['codigo']], c['filaInicio'])
            with sin_proteccion(hoja):
                for r in regs:
                    if r['codigo'] not in filas:
                        faltan.append(r['codigo'])
                        continue
                    k, fila0 = '%s|%s' % (nombre, r['codigo']), filas[r['codigo']] - 1
                    actual = [_valor(hoja, col, fila0) for col in cols]
                    esperado = [celda(x, r['valores'].get(x['key'])) for x in campos]
                    previo = base.get(k)
                    a_mano = actual != previo if previo is not None else any(v != '' for v in actual)
                    if a_mano and actual != esperado and r['codigo'] not in forzar:
                        tocadas.append(r['codigo'])
                        continue
                    for col, v in zip(cols, esperado):
                        cel = hoja.getCellByPosition(col, fila0)
                        if isinstance(v, float):
                            cel.setValue(v)
                        elif v:
                            cel.setString(v)
                        elif cel.getType().value != 'EMPTY':
                            cel.setFormula('')
                    escrito[k] = esperado
                    leidos[r['clave']] = (hoja, fila0, enc)
        if escrito:
            doc.calculateAll()
            calculado = {clave: {x: hoja.getCellByPosition(enc[x], fila0).getString() for x in ('Control', 'Veredicto', 'Permisos del tramo') if x in enc}
                         for clave, (hoja, fila0, enc) in leidos.items()}
            office.guardar_xlsx(doc, salida)
    finally:
        doc.close(True)

    rev = meta['rev']
    if escrito:
        with open(salida, 'rb') as fh:
            try:
                rev = dbx.subir(ruta, fh.read(), {'.tag': 'update', 'update': meta['rev']})['rev']
            except DropboxError as err:
                if err.estado == 409:
                    log.info('Fibra %s: la planilla cambió durante la generación; se reintenta en el próximo ciclo.', comuna)
                    conn.rollback()
                    return False
                raise
        for clave, calc in calculado.items():
            conn.execute('UPDATE fibra_registros SET calculado=%s WHERE clave=%s', (Jsonb(calc), clave))
    conn.execute('''INSERT INTO planillas_fibra (comuna, rev_generada, generada_en, filas_generadas) VALUES (%s, %s, clock_timestamp(), %s)
                    ON CONFLICT (comuna) DO UPDATE SET rev_generada=EXCLUDED.rev_generada, generada_en=EXCLUDED.generada_en,
                      filas_generadas=EXCLUDED.filas_generadas''', (comuna, rev, Jsonb({**base, **escrito})))
    db.evento(conn, 'fibra_generado', comuna, rev=rev, filas=len(escrito), forzadas=list(forzar))
    conn.commit()
    log.info('Fibra %s: planilla actualizada con %d fila(s); revisión %s.', comuna, len(escrito), rev)
    if malas:
        avisar(dbx, conn, comuna, 'La(s) hoja(s) %s no existen o no tienen los encabezados del contrato; no se escribieron. '
               'Si se cambió la planilla, hay que regenerar el contrato de fibra.' % ', '.join('«%s»' % h for h in malas))
    if tocadas:
        avisar(dbx, conn, comuna, 'Las filas de %s fueron cambiadas a mano y no se reescribieron. Para que prevalezca lo enviado '
               'desde la app: parte fibra --forzar %s' % (', '.join(tocadas), ' '.join(tocadas)))
    if faltan:
        avisar(dbx, conn, comuna, 'Hay registros de códigos que no están en la planilla: %s.' % ', '.join(sorted(faltan)))
    conn.commit()
    for viejo in sorted(x for x in os.listdir(carpeta) if x.endswith('.xlsx'))[:-20]:
        os.remove(os.path.join(carpeta, viejo))
    return True


def pasada(dbx, office, conn, trabajo, reposo_min=10, forzar=()):
    if not configurado():
        return
    ingestar(dbx, conn)
    for comuna in COMUNAS:
        if comuna in config()['planillas'] and (forzar or pendiente(conn, comuna)):
            try:
                generar(dbx, office, conn, comuna, trabajo, reposo_min, forzar)
            except Exception:
                conn.rollback()
                log.exception('Fibra %s: la generación falló; se reintenta en el próximo ciclo.', comuna)
