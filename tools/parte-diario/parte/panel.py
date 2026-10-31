"""Resumen para el panel ejecutivo de la Intranet: el servicio lo envía; la base de datos nunca se publica.

Se manda en cada ciclo si algo cambió y, aunque no cambie nada, cada PARTE_PANEL_LATIDO_MIN minutos, para que el
panel sepa que el servicio sigue vivo. Sin PARTE_PANEL_URL y PARTE_PANEL_TOKEN no se envía nada."""
import datetime
import hashlib
import json
import logging
import os
import time
import urllib.error
import urllib.request

log = logging.getLogger('parte')


def resumen(conn):
    comunas = conn.execute('SELECT comuna, prefijo, planilla, generada_en, ultimo_aviso FROM comunas ORDER BY comuna').fetchall()
    registros = conn.execute('''
        SELECT r.id_planilla AS id, r.comuna, r.fecha, r.punto, r.hecho, r.tipo, r.ejecuto,
               CASE WHEN r.origen = 'manual' THEN r.detalle_manual ELSE r.observacion END AS detalle,
               r.foto = 'Sí' AS foto, f.ruta AS foto_ruta, r.control, r.anulado_en IS NOT NULL AS anulado,
               r.registrado_por, r.gps_lat AS lat, r.gps_lon AS lon, r.origen, r.recibido_en, r.guardado_en
        FROM registros r
        LEFT JOIN LATERAL (SELECT ruta FROM fotos WHERE registro_id = r.id AND ruta <> '' ORDER BY id LIMIT 1) f ON true
        ORDER BY r.comuna, r.fila''').fetchall()
    for c in comunas:
        c['generada_en'] = c['generada_en'].isoformat() if c['generada_en'] else None
    for r in registros:
        r['fecha'] = r['fecha'].isoformat()
        for k in ('recibido_en', 'guardado_en'):
            r[k] = r[k].isoformat() if r[k] else None
    return {'comunas': comunas, 'registros': registros}


class Publicador:
    def __init__(self):
        self.url = os.environ.get('PARTE_PANEL_URL') or ''
        self.token = os.environ.get('PARTE_PANEL_TOKEN') or ''
        self.latido = int(os.environ.get('PARTE_PANEL_LATIDO_MIN') or 5) * 60
        self.huella, self.enviado = None, 0.0
        if not (self.url and self.token):
            log.info('Sin PARTE_PANEL_URL/PARTE_PANEL_TOKEN: no se envía el resumen al panel.')

    def publicar(self, conn):
        if not (self.url and self.token):
            return
        datos = resumen(conn)
        conn.rollback()  # solo lectura: no deja la transacción abierta durante la espera del ciclo
        huella = hashlib.sha256(json.dumps(datos, sort_keys=True, default=str).encode()).hexdigest()
        if huella == self.huella and time.time() - self.enviado < self.latido:
            return
        datos['generado'] = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
        cuerpo = json.dumps(datos, ensure_ascii=False, default=str).encode('utf-8')
        req = urllib.request.Request(self.url, data=cuerpo, method='POST', headers={
            'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json; charset=utf-8'})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp.read()
            self.huella, self.enviado = huella, time.time()
        except (urllib.error.URLError, OSError) as e:
            detalle = e.read().decode('utf-8', 'replace')[:200] if isinstance(e, urllib.error.HTTPError) else ''
            log.error('No se pudo enviar el resumen al panel: %s %s', e, detalle)
