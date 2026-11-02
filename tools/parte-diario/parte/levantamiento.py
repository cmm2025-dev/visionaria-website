"""Levantamiento en terreno (formulario DEC-020): cola de Dropbox → base de datos → hoja «Levantamiento».

La app deja un JSON por punto y por envío. El más reciente de cada punto queda vigente y se escribe en las columnas
S..BU de su fila (buscada por código en la columna A), tal como dice el contrato que se generó desde el mismo
formulario. Las columnas calculadas (ángulos LPR y «Control») las sigue calculando la planilla. Una fila que alguien
cambió a mano desde la última generación no se pisa: queda un aviso hasta que se decida con --forzar.

Configuración (en .env): PARTE_LEVANTAMIENTO_PLANILLA (ruta del formulario en Dropbox) y PARTE_LEVANTAMIENTO_COLA
(carpeta de la cola; adentro, una carpeta por comuna). Sin las dos, el levantamiento no se procesa."""
import datetime
import json
import logging
import os
import urllib.parse

from psycopg.types.json import Jsonb

from . import correo, db
from .dropbox import DropboxError
from .generar import planilla_en_uso
from .planilla import FECHA_BASE

log = logging.getLogger('parte.levantamiento')
VERSION = 1
CONTRATO = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'levantamiento_contrato.json'), encoding='utf-8'))
CAMPOS = {c['col']: c for c in CONTRATO['campos']}
PUNTOS = {p['A']: p for p in CONTRATO['puntos']}
COLUMNA_FOTOS = 'BW'           # la agrega el sistema, a la derecha de «Control»: enlace a las fotos del punto


def col_num(c):
    n = 0
    for ch in c:
        n = n * 26 + ord(ch) - 64
    return n


COLS = sorted(CAMPOS, key=col_num)           # S..BU sin las calculadas, en orden de la hoja
PRIMERA, ULTIMA = col_num('S') - 1, col_num('BU') - 1   # 0-based, rango que se lee de una vez


def configurado():
    return bool(os.environ.get('PARTE_LEVANTAMIENTO_PLANILLA') and os.environ.get('PARTE_LEVANTAMIENTO_COLA'))


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
    if not isinstance(r, dict) or r.get('version') != VERSION or r.get('tipo') != 'levantamiento':
        return 'Versión de envío no reconocida.', None
    for campo in ('id', 'codigo', 'comuna', 'guardado'):
        if not isinstance(r.get(campo), str) or not r[campo].strip():
            return 'Falta el campo «%s».' % campo, None
    punto = PUNTOS.get(r['codigo'])
    if not punto:
        return 'El punto %s no está en el formulario.' % r['codigo'], None
    if r['comuna'] != comuna or punto['B'] != comuna:
        return 'El punto %s es de %s y esta cola es de %s.' % (r['codigo'], punto['B'], comuna), None
    try:
        datetime.datetime.fromisoformat(r['guardado'].replace('Z', '+00:00'))
    except ValueError:
        return 'Fecha de guardado no válida.', None
    valores, errores = {}, []
    for col, v in (r.get('valores') or {}).items():
        if col not in CAMPOS:
            errores.append('%s: columna que no está en el contrato' % col)
            continue
        try:
            n = valor_valido(CAMPOS[col], v)
        except (ValueError, TypeError) as e:
            errores.append('%s (%s): %s' % (col, CAMPOS[col]['label'], e))
            continue
        if n is not None:
            valores[col] = n
    if errores:
        return 'Valores no válidos: ' + '; '.join(errores), None
    return None, valores


# --- Cola → base de datos ---------------------------------------------------------------------------------------

def ingestar(dbx, conn):
    base = os.environ['PARTE_LEVANTAMIENTO_COLA'].rstrip('/')
    nuevos = 0
    for comuna in sorted({p['B'] for p in PUNTOS.values()}):
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
    """Guarda el envío y, si es el más reciente del punto, lo deja vigente. Nada se borra."""
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
        conn.execute('''INSERT INTO levantamientos (codigo, comuna, valores, fotos, gps, registrado_por, envio_id, guardado_en)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (codigo) DO UPDATE SET valores=EXCLUDED.valores, fotos=EXCLUDED.fotos, gps=EXCLUDED.gps,
                          registrado_por=EXCLUDED.registrado_por, envio_id=EXCLUDED.envio_id, guardado_en=EXCLUDED.guardado_en,
                          actualizado_en=clock_timestamp()''',
                     (r['codigo'], comuna, Jsonb(valores), Jsonb(r.get('fotos') or []), Jsonb(r.get('gps')) if r.get('gps') else None,
                      r.get('registro') or None, r['id'], guardado))
    conn.execute('INSERT INTO levantamiento_envios (id, codigo, contenido, estado) VALUES (%s,%s,%s,%s)',
                 (r['id'], r['codigo'], Jsonb(r), estado))
    db.evento(conn, 'levantamiento_' + estado, comuna, r['codigo'], r.get('registro'), envio=r['id'])
    return {'estado': estado, 'codigo': r['codigo']}


# --- Base de datos → planilla -----------------------------------------------------------------------------------

def estado(conn):
    return conn.execute('SELECT * FROM planilla_levantamiento WHERE id=1').fetchone() or {
        'rev_generada': None, 'generada_en': None, 'filas_generadas': None, 'ultimo_aviso': None}


def pendiente(conn):
    m = conn.execute('SELECT MAX(actualizado_en) AS m FROM levantamientos').fetchone()['m']
    e = estado(conn)
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


def avisar(dbx, conn, texto):
    e = estado(conn)
    if e['ultimo_aviso'] == texto:
        return
    log.warning('Levantamiento: %s', texto)
    db.evento(conn, 'levantamiento_aviso', detalle=texto)
    conn.execute('''INSERT INTO planilla_levantamiento (id, ultimo_aviso) VALUES (1, %s)
                    ON CONFLICT (id) DO UPDATE SET ultimo_aviso=EXCLUDED.ultimo_aviso''', (texto,))
    conn.commit()
    correo.avisar_falla(conn, 'LEVANTAMIENTO DEC-020', texto)
    ruta = '%s/AVISOS/Levantamiento_%s.txt' % (os.environ['PARTE_LEVANTAMIENTO_COLA'].rstrip('/'),
                                                datetime.datetime.now().strftime('%Y-%m-%d_%H%M'))
    try:
        dbx.subir(ruta, (texto + '\n').encode('utf-8'), 'overwrite', sobrescribir=True)
    except DropboxError as err:
        log.error('No se pudo dejar el aviso en Dropbox: %s', err)


def url_carpeta(ruta):
    return 'https://www.dropbox.com/home' + urllib.parse.quote(ruta.rsplit('/', 1)[0])


def generar(dbx, office, conn, trabajo, reposo_min=10, forzar=()):
    """Escribe los levantamientos vigentes en la hoja. Devuelve True si la planilla quedó actualizada en Dropbox.

    forzar: códigos cuya fila se reescribe aunque alguien la haya cambiado a mano."""
    ruta = os.environ['PARTE_LEVANTAMIENTO_PLANILLA']
    meta = dbx.metadata(ruta)
    minutos = (datetime.datetime.utcnow() - datetime.datetime.strptime(meta['server_modified'], '%Y-%m-%dT%H:%M:%SZ')).total_seconds() / 60
    e = estado(conn)
    if minutos < reposo_min and meta['rev'] != e['rev_generada'] and not forzar:
        log.info('Levantamiento: la planilla cambió hace %d min; se espera.', minutos)
        return False
    en_uso = planilla_en_uso(dbx, ruta)
    if en_uso and not forzar:
        log.info('Levantamiento: la planilla está abierta (%s); se espera.', ', '.join(en_uso))
        return False

    carpeta = os.path.join(trabajo, 'levantamiento')
    os.makedirs(carpeta, exist_ok=True)
    sello = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    datos, meta = dbx.descargar(ruta)
    entrada, salida = os.path.join(carpeta, '%s_antes.xlsx' % sello), os.path.join(carpeta, '%s_despues.xlsx' % sello)
    with open(entrada, 'wb') as f:
        f.write(datos)

    vigentes = {r['codigo']: r for r in conn.execute('SELECT * FROM levantamientos').fetchall()}
    base = e['filas_generadas'] or {}
    doc = office.abrir(entrada)
    try:
        hoja = doc.Sheets.getByName(CONTRATO['hoja'])
        filas = {}
        f = CONTRATO['filaInicio']
        while hoja.getCellByPosition(0, f - 1).getString():
            filas[hoja.getCellByPosition(0, f - 1).getString()] = f
            f += 1
        actual = {}
        if filas:
            desde, hasta = min(filas.values()), max(filas.values())
            bloque = hoja.getCellRangeByPosition(PRIMERA, desde - 1, ULTIMA, hasta - 1).getDataArray()
            actual = {codigo: [bloque[fila - desde][col_num(c) - 1 - PRIMERA] for c in COLS] for codigo, fila in filas.items()}

        faltan = sorted(set(vigentes) - set(filas))
        tocadas, escrito = [], {}
        for codigo, r in vigentes.items():
            if codigo not in filas:
                continue
            esperado = [celda(CAMPOS[c], r['valores'].get(c)) for c in COLS]
            previo = base.get(codigo)
            a_mano = actual[codigo] != previo if previo is not None else any(v not in ('', None) for v in actual[codigo])
            if a_mano and actual[codigo] != esperado and codigo not in forzar:
                tocadas.append(codigo)
                continue
            fila = filas[codigo] - 1
            for c, v in zip(COLS, esperado):
                cel = hoja.getCellByPosition(col_num(c) - 1, fila)
                if isinstance(v, float):
                    cel.setValue(v)
                elif v:
                    cel.setString(v)
                elif cel.getType().value != 'EMPTY':
                    cel.setFormula('')
            fotos = [x for x in (r['fotos'] or []) if x.get('ruta')]
            cel = hoja.getCellByPosition(col_num(COLUMNA_FOTOS) - 1, fila)
            if fotos:
                cel.setFormula('=HYPERLINK("%s";"%d foto%s")' % (url_carpeta(fotos[0]['ruta']), len(fotos), '' if len(fotos) == 1 else 's'))
            escrito[codigo] = esperado
        encabezado = hoja.getCellByPosition(col_num(COLUMNA_FOTOS) - 1, CONTRATO['filaEncabezado'] - 1)
        if encabezado.getString() != 'Fotos (Dropbox)':
            modelo = hoja.getCellByPosition(col_num('BV') - 1, CONTRATO['filaEncabezado'] - 1)
            hoja.copyRange(encabezado.CellAddress, modelo.RangeAddress)
            encabezado.setString('Fotos (Dropbox)')
        doc.calculateAll()
        control = {codigo: hoja.getCellByPosition(col_num('BV') - 1, filas[codigo] - 1).getString() for codigo in escrito}
        office.guardar_xlsx(doc, salida)
    finally:
        doc.close(True)

    with open(salida, 'rb') as fh:
        try:
            subida = dbx.subir(ruta, fh.read(), {'.tag': 'update', 'update': meta['rev']})
        except DropboxError as err:
            if err.estado == 409:
                log.info('Levantamiento: la planilla cambió durante la generación; se reintenta en el próximo ciclo.')
                conn.rollback()
                return False
            raise
    nueva_base = {**base, **escrito}
    conn.execute('''INSERT INTO planilla_levantamiento (id, rev_generada, generada_en, filas_generadas) VALUES (1, %s, clock_timestamp(), %s)
                    ON CONFLICT (id) DO UPDATE SET rev_generada=EXCLUDED.rev_generada, generada_en=EXCLUDED.generada_en,
                      filas_generadas=EXCLUDED.filas_generadas''', (subida['rev'], Jsonb(nueva_base)))
    for codigo, texto in control.items():
        conn.execute('UPDATE levantamientos SET control=%s WHERE codigo=%s', (texto, codigo))
    db.evento(conn, 'levantamiento_generado', rev=subida['rev'], filas=len(escrito), forzadas=list(forzar))
    conn.commit()
    log.info('Levantamiento: planilla actualizada con %d punto(s); revisión %s.', len(escrito), subida['rev'])
    if tocadas:
        avisar(dbx, conn, 'Las filas de %s en la hoja «Levantamiento» fueron cambiadas a mano y no se reescribieron. Para que '
               'prevalezca lo enviado desde la app: parte levantamiento --forzar %s' % (', '.join(tocadas), ' '.join(tocadas)))
    if faltan:
        avisar(dbx, conn, 'Hay levantamientos de puntos que no están en la hoja «Levantamiento»: %s.' % ', '.join(faltan))
    for viejo in sorted(x for x in os.listdir(carpeta) if x.endswith('.xlsx'))[:-20]:
        os.remove(os.path.join(carpeta, viejo))
    return True


def pasada(dbx, office, conn, trabajo, reposo_min=10, forzar=()):
    if not configurado():
        return
    ingestar(dbx, conn)
    if forzar or pendiente(conn):
        generar(dbx, office, conn, trabajo, reposo_min, forzar)
