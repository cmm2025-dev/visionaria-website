"""Después de renombrar o mover una carpeta en Dropbox: actualiza las rutas de fotos guardadas en la base y los enlaces
(=HYPERLINK a dropbox.com/home/…) que el servicio escribió en las planillas, de la ruta antigua a la nueva.

Las operaciones con Dropbox siguen funcionando sin esto gracias al alias (PARTE_DROPBOX_ALIAS); lo que se rompe al
renombrar son los enlaces que abre una persona en el navegador, porque llevan el nombre de la carpeta.

    parte reenlazar --desde /Proyectos/2026-DPR-ANF_OPERACIONES --hacia "/Proyectos/<nombre nuevo>"            (solo informa)
    parte reenlazar --desde … --hacia … --aplicar                                                                (lo hace)

Las planillas se escriben con las mismas reglas del servicio: no si están abiertas, nunca sobre una versión más nueva.
Conviene correrlo con el servicio detenido."""
import json
import logging
import os
import urllib.parse

from psycopg.types.json import Jsonb

from . import db
from .dropbox import DropboxError
from .generar import planilla_en_uso

log = logging.getLogger('parte.reenlazar')


def _cambiar(texto, desde, hacia):
    """Reemplaza la ruta antigua por la nueva, tanto escrita tal cual como codificada para una URL."""
    if not isinstance(texto, str):
        return texto
    for a, b in ((urllib.parse.quote(desde), urllib.parse.quote(hacia)), (desde, hacia)):
        texto = texto.replace(a, b)
    return texto


def base(conn, desde, hacia, aplicar):
    """Rutas guardadas: fotos del parte diario, fotos de levantamientos y de fibra."""
    cambios = 0
    for r in conn.execute("SELECT id, ruta FROM fotos WHERE ruta LIKE %s", (desde + '%',)).fetchall():
        cambios += 1
        if aplicar:
            conn.execute('UPDATE fotos SET ruta=%s WHERE id=%s', (_cambiar(r['ruta'], desde, hacia), r['id']))
    for tabla, clave in (('levantamientos', 'codigo'), ('fibra_registros', 'clave')):
        filas = conn.execute('SELECT %s AS k, fotos FROM %s WHERE fotos::text LIKE %%s' % (clave, tabla), ('%' + desde + '%',)).fetchall()
        for r in filas:
            cambios += 1
            if aplicar:
                nuevas = [{**f, 'ruta': _cambiar(f.get('ruta'), desde, hacia)} for f in r['fotos']]
                conn.execute('UPDATE %s SET fotos=%%s WHERE %s=%%s' % (tabla, clave), (Jsonb(nuevas), r['k']))
    if aplicar:
        db.evento(conn, 'reenlazar_base', detalle='%s → %s' % (desde, hacia), filas=cambios)
        conn.commit()
    return cambios


def planillas_con_enlaces(conn):
    """Las planillas donde el servicio escribe enlaces a fotos: las de terreno (parte diario) y las de levantamiento."""
    from . import levantamiento
    rutas = [c['planilla'] for c in db.comunas(conn) if c.get('planilla')]
    rutas += list(levantamiento.config()['planillas'].values())
    try:
        from . import fibra
        rutas += list(fibra.config()['planillas'].values())
    except Exception:
        pass
    return list(dict.fromkeys(rutas))


def planilla(dbx, office, ruta, desde, hacia, aplicar, trabajo):
    """(enlaces cambiados, subida) en una planilla."""
    if aplicar and planilla_en_uso(dbx, ruta):
        return None, 'abierta: no se tocó'
    datos, meta = dbx.descargar(ruta)
    entrada = os.path.join(trabajo, 'reenlazar_' + os.path.basename(ruta))
    with open(entrada, 'wb') as fh:
        fh.write(datos)
    doc = office.abrir(entrada)
    viejo_url = 'dropbox.com/home' + urllib.parse.quote(desde)
    n = 0
    try:
        for i in range(doc.Sheets.Count):
            hoja = doc.Sheets.getByIndex(i)
            cur = hoja.createCursor()
            cur.gotoEndOfUsedArea(False)
            fin = cur.RangeAddress
            rango = hoja.getCellRangeByPosition(0, 0, fin.EndColumn, fin.EndRow)
            formulas = rango.getFormulaArray()
            for f, fila in enumerate(formulas):
                for c, texto in enumerate(fila):
                    if viejo_url in texto:
                        n += 1
                        if aplicar:
                            hoja.getCellByPosition(c, f).setFormula(_cambiar(texto, desde, hacia))
        if aplicar and n:
            salida = entrada.replace('.xlsx', '_nueva.xlsx')
            office.guardar_xlsx(doc, salida)
    finally:
        doc.close(True)
    if not (aplicar and n):
        return n, ''
    with open(salida, 'rb') as fh:
        try:
            nueva = dbx.subir(ruta, fh.read(), {'.tag': 'update', 'update': meta['rev']})
        except DropboxError as e:
            return n, 'cambió mientras se procesaba: no se subió (%s)' % e
    return n, 'subida, revisión %s' % nueva['rev']


def correr(dbx, office, conn, desde, hacia, aplicar, trabajo):
    desde, hacia = desde.rstrip('/'), hacia.rstrip('/')
    print('%s: %s → %s' % ('APLICANDO' if aplicar else 'Solo informe (agrega --aplicar para hacerlo)', desde, hacia))
    print('  base de datos: %d registro(s) con rutas por actualizar' % base(conn, desde, hacia, aplicar))
    for ruta in planillas_con_enlaces(conn):
        try:
            n, estado = planilla(dbx, office, ruta, desde, hacia, aplicar, trabajo)
        except DropboxError as e:
            n, estado = None, 'no se pudo leer: %s' % e
        print('  %s: %s enlace(s)%s' % (os.path.basename(ruta), '?' if n is None else n, (' · ' + estado) if estado else ''))
