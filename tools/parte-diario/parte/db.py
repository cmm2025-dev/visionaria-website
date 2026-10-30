"""PostgreSQL: conexión, esquema y operaciones sobre registros."""
import datetime
import json
import os

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

AQUI = os.path.dirname(os.path.abspath(__file__))


def conectar():
    dsn = os.environ.get('PARTE_DB') or 'postgresql://parte:parte@localhost:5432/parte'
    return psycopg.connect(dsn, row_factory=dict_row, autocommit=False)


def migrar(conn):
    with open(os.path.join(AQUI, '..', 'schema.sql'), encoding='utf-8') as f:
        conn.execute(f.read())
    conn.commit()


def evento(conn, tipo, comuna=None, registro_id=None, quien=None, **detalle):
    conn.execute('INSERT INTO eventos (tipo, comuna, registro_id, quien, detalle) VALUES (%s,%s,%s,%s,%s)',
                 (tipo, comuna, registro_id, quien, Jsonb(detalle) if detalle else None))


def sembrar_comunas(conn, config):
    """Crea o actualiza las comunas desde comunas.json. Las rutas pueden cambiar; el prefijo no debería."""
    for comuna, c in config.items():
        conn.execute('''INSERT INTO comunas (comuna, prefijo, planilla, colas) VALUES (%s,%s,%s,%s)
                        ON CONFLICT (comuna) DO UPDATE SET prefijo=EXCLUDED.prefijo, planilla=EXCLUDED.planilla, colas=EXCLUDED.colas''',
                     (comuna, c['prefijo'], c.get('planilla'), c.get('colas', [])))
    conn.commit()


def comunas(conn):
    return conn.execute('SELECT * FROM comunas ORDER BY comuna').fetchall()


def comuna(conn, nombre):
    return conn.execute('SELECT * FROM comunas WHERE comuna=%s', (nombre,)).fetchone()


def id_planilla(prefijo, fila):
    return '%s-P%04d' % (prefijo, fila - 4)  # igual que la fórmula de la columna A


def siguiente_fila(conn, nombre, fila_inicio):
    """Primera fila libre de la comuna. Se bloquea la fila de la comuna para que dos ingestas no choquen."""
    conn.execute('SELECT 1 FROM comunas WHERE comuna=%s FOR UPDATE', (nombre,))
    r = conn.execute('SELECT COALESCE(MAX(fila), %s) AS f FROM registros WHERE comuna=%s', (fila_inicio - 1, nombre)).fetchone()
    return r['f'] + 1


def existe(conn, registro_id):
    return conn.execute('SELECT fila, id_planilla FROM registros WHERE id=%s', (registro_id,)).fetchone()


def insertar_registro(conn, r, fotos=()):
    conn.execute('''INSERT INTO registros (id, comuna, fila, id_planilla, fecha, punto, hecho, tipo, ejecuto, observacion,
                    registrado_por, gps_lat, gps_lon, gps_precision, gps_origen, foto, piloto, origen, detalle_manual, guardado_en,
                    anulado_en, anulado_por, motivo_anulacion)
                    VALUES (%(id)s, %(comuna)s, %(fila)s, %(id_planilla)s, %(fecha)s, %(punto)s, %(hecho)s, %(tipo)s, %(ejecuto)s,
                    %(observacion)s, %(registrado_por)s, %(gps_lat)s, %(gps_lon)s, %(gps_precision)s, %(gps_origen)s, %(foto)s,
                    %(piloto)s, %(origen)s, %(detalle_manual)s, %(guardado_en)s, %(anulado_en)s, %(anulado_por)s, %(motivo_anulacion)s)''',
                 {k: r.get(k) for k in ('id', 'comuna', 'fila', 'id_planilla', 'fecha', 'punto', 'hecho', 'tipo', 'ejecuto',
                                        'observacion', 'registrado_por', 'gps_lat', 'gps_lon', 'gps_precision', 'gps_origen', 'foto',
                                        'piloto', 'origen', 'detalle_manual', 'guardado_en', 'anulado_en', 'anulado_por',
                                        'motivo_anulacion')})
    for f in fotos:
        conn.execute('INSERT INTO fotos (registro_id, nombre, ruta, toma, dropbox_id, hash) VALUES (%s,%s,%s,%s,%s,%s)',
                     (r['id'], f.get('nombre') or '', f.get('ruta'), f.get('toma'), f.get('dropbox_id'), f.get('hash')))


def registros_de(conn, nombre):
    return conn.execute('SELECT * FROM registros WHERE comuna=%s ORDER BY fila', (nombre,)).fetchall()


def fotos_de(conn, nombre):
    """{registro_id: ruta de su primera foto} de los registros de la comuna que tienen foto en Dropbox."""
    filas = conn.execute('''SELECT DISTINCT ON (f.registro_id) f.registro_id, f.ruta FROM fotos f
                            JOIN registros r ON r.id = f.registro_id
                            WHERE r.comuna=%s AND f.ruta IS NOT NULL AND f.ruta <> '' ORDER BY f.registro_id, f.id''',
                         (nombre,)).fetchall()
    return {r['registro_id']: r['ruta'] for r in filas}


def buscar(conn, id_planilla):
    return conn.execute('SELECT * FROM registros WHERE id_planilla=%s', (id_planilla,)).fetchone()


def anular(conn, registro, quien, motivo):
    if registro['anulado_en']:
        raise ValueError('%s ya estaba anulado el %s.' % (registro['id_planilla'], registro['anulado_en'].date()))
    conn.execute('UPDATE registros SET anulado_en=now(), anulado_por=%s, motivo_anulacion=%s, actualizado_en=now() WHERE id=%s',
                 (quien, motivo, registro['id']))
    evento(conn, 'anulado', registro['comuna'], registro['id'], quien, motivo=motivo, id_planilla=registro['id_planilla'])


def pendiente_de_generar(conn, c):
    """Hay algo nuevo desde la última generación, o nunca se generó."""
    r = conn.execute('SELECT MAX(actualizado_en) AS m FROM registros WHERE comuna=%s', (c['comuna'],)).fetchone()
    return r['m'] is not None and (c['generada_en'] is None or r['m'] > c['generada_en'])


def reubicar(conn, registro, fila, prefijo):
    """Mueve a otra fila un registro que todavía no está en la planilla (choca con una fila escrita a mano)."""
    conn.execute('UPDATE registros SET fila=%s, id_planilla=%s, actualizado_en=now() WHERE id=%s',
                 (fila, id_planilla(prefijo, fila), registro['id']))
    evento(conn, 'reubicado', registro['comuna'], registro['id'], de=registro['id_planilla'], a=id_planilla(prefijo, fila))


def volver_manual(conn, registro, v):
    """La planilla manda: el registro toma lo que alguien escribió a mano en su fila."""
    from .planilla import fecha_de
    conn.execute('''UPDATE registros SET origen='manual', fecha=COALESCE(%s, fecha), punto=%s, hecho=%s, ejecuto=%s, foto=%s,
                    detalle_manual=%s, anulado_en=CASE WHEN %s='Anulada' THEN COALESCE(anulado_en, now()) ELSE anulado_en END,
                    anulado_por=CASE WHEN %s='Anulada' THEN COALESCE(anulado_por, 'planilla') ELSE anulado_por END,
                    actualizado_en=now() WHERE id=%s''',
                 (fecha_de(v[0]), str(v[1]), str(v[2]), str(v[3]) or None, str(v[5]), str(v[4]), v[6], v[6], registro['id']))
    evento(conn, 'manual_prevalece', registro['comuna'], registro['id'], antes=registro['id_planilla'], valores=[str(x) for x in v])


def marcar_generada(conn, nombre, rev, calculados, escrito):
    """calculados: {fila: (id_planilla, nombre_foto, control)} leídos de la planilla ya recalculada;
    escrito: {fila: [B..H]} tal como quedó, para reconocer ediciones a mano en la próxima generación."""
    for fila, (idp, nombre_foto, control) in calculados.items():
        conn.execute('UPDATE registros SET control=%s, nombre_foto=%s WHERE comuna=%s AND fila=%s', (control, nombre_foto, nombre, fila))
    conn.execute('UPDATE comunas SET rev_generada=%s, generada_en=now(), ultimo_aviso=NULL, filas_generadas=%s WHERE comuna=%s',
                 (rev, Jsonb({str(f): v for f, v in escrito.items()}), nombre))


def estado_json(conn, nombre):
    filas = conn.execute('''SELECT id_planilla, fila, fecha, punto, hecho, ejecuto, foto, control, nombre_foto, origen,
                            anulado_en IS NOT NULL AS anulado, registrado_por FROM registros WHERE comuna=%s ORDER BY fila''',
                         (nombre,)).fetchall()
    for f in filas:
        f['fecha'] = f['fecha'].isoformat()
    return json.dumps({'comuna': nombre, 'generado': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                       'filas': filas}, ensure_ascii=False, indent=1)
