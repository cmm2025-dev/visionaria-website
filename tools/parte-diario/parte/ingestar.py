"""Cola de Dropbox → base de datos. Cada JSON que deja la app se vuelve un registro con su fila fija."""
import datetime
import json
import logging

from . import db
from .dropbox import DropboxError
from .planilla import FILA_INICIO, FILA_FIN

log = logging.getLogger('parte.ingestar')
VERSION_REGISTRO = 1


def validar(r, comuna):
    if not isinstance(r, dict) or r.get('version') != VERSION_REGISTRO:
        return 'Versión de registro no reconocida.'
    for campo in ('id', 'comuna', 'punto', 'fecha', 'hecho'):
        if not isinstance(r.get(campo), str) or not r[campo].strip():
            return 'Falta el campo «%s».' % campo
    if r['comuna'] != comuna:
        return 'El registro es de %s y esta cola es de %s.' % (r['comuna'], comuna)
    try:
        datetime.date.fromisoformat(r['fecha'])
    except ValueError:
        return 'Fecha no válida.'
    return None


def a_registro(r, comuna, fila, prefijo):
    gps = r.get('gps') or {}
    return {
        'id': r['id'], 'comuna': comuna, 'fila': fila, 'id_planilla': db.id_planilla(prefijo, fila),
        'fecha': datetime.date.fromisoformat(r['fecha']), 'punto': r['punto'].strip(), 'hecho': r['hecho'].strip(),
        'tipo': r.get('tipo') or None, 'ejecuto': (r.get('ejecuto') or '').strip() or None,
        'observacion': (r.get('observacion') or '').strip() or None, 'registrado_por': r.get('registro') or None,
        'gps_lat': gps.get('lat'), 'gps_lon': gps.get('lon'),
        'gps_precision': int(round(gps['accuracy'])) if gps.get('accuracy') is not None else None,
        'gps_origen': r.get('gpsOrigen') or None, 'foto': 'Sí' if r.get('fotos') else 'No', 'piloto': bool(r.get('piloto')),
        'origen': 'app', 'detalle_manual': None, 'guardado_en': r.get('guardado') or None,
    }


def ingestar_comuna(dbx, conn, c):
    """Procesa todas las colas de una comuna. Devuelve cuántos registros nuevos entraron."""
    nuevos = 0
    for cola in c['colas']:
        try:
            archivos = [e for e in dbx.listar(cola) if e['.tag'] == 'file' and e['name'].lower().endswith('.json')]
        except DropboxError as e:
            if e.es('not_found'):
                continue  # nadie ha enviado nada todavía a esta cola
            raise
        for e in sorted(archivos, key=lambda x: x['name']):
            nombre, ruta = e['name'], e['path_display']
            datos, _ = dbx.descargar(ruta)
            try:
                r = json.loads(datos.decode('utf-8'))
                motivo = validar(r, c['comuna'])
            except (ValueError, UnicodeDecodeError):
                r, motivo = None, 'El archivo no es un JSON válido.'
            if motivo:
                resultado = {'estado': 'rechazado', 'motivo': motivo}
                destino = 'rechazados'
                db.evento(conn, 'rechazado', c['comuna'], r.get('id') if isinstance(r, dict) else None, archivo=nombre, motivo=motivo)
            else:
                previo = db.existe(conn, r['id'])
                if previo:
                    resultado = {'estado': 'ya_recibido', 'fila': previo['fila'], 'id': previo['id_planilla']}
                else:
                    fila = db.siguiente_fila(conn, c['comuna'], FILA_INICIO)
                    if fila > FILA_FIN:
                        log.error('%s: la planilla no tiene filas libres; %s queda en la cola.', c['comuna'], nombre)
                        conn.rollback()
                        continue
                    registro = a_registro(r, c['comuna'], fila, c['prefijo'])
                    db.insertar_registro(conn, registro, r.get('fotos') or [])
                    db.evento(conn, 'recibido', c['comuna'], r['id'], r.get('registro'), fila=fila, archivo=nombre)
                    resultado = {'estado': 'recibido', 'fila': fila, 'id': registro['id_planilla']}
                    nuevos += 1
                destino = 'procesados'
            conn.commit()
            # Primero se deja constancia en Dropbox y después se mueve el archivo; si algo falla entre medio,
            # la próxima pasada lo encuentra y responde «ya_recibido».
            resultado['procesado'] = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
            base = nombre[:-5]
            dbx.subir('%s/%s/%s.resultado.json' % (cola, destino, base),
                      json.dumps(resultado, ensure_ascii=False, indent=1).encode('utf-8'), 'overwrite', sobrescribir=True)
            dbx.mover(ruta, '%s/%s/%s' % (cola, destino, nombre))
            log.info('%s: %s → %s%s', c['comuna'], nombre, resultado['estado'],
                     ' fila %s (%s)' % (resultado['fila'], resultado['id']) if 'fila' in resultado else ' · ' + resultado.get('motivo', ''))
    return nuevos
