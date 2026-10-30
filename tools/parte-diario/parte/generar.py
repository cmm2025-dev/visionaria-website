"""Base de datos → planilla de terreno. Reescribe las filas B..H del «Parte diario» y sube la planilla."""
import datetime
import logging
import os

from . import db, planilla
from .dropbox import DropboxError

log = logging.getLogger('parte.generar')


def planilla_en_uso(dbx, ruta):
    """Archivos de bloqueo de Excel o LibreOffice junto a la planilla, si Dropbox los sincronizó."""
    carpeta, nombre = ruta.rsplit('/', 1)
    marcas = {'~$' + nombre, '~$' + nombre[2:], '.~lock.' + nombre + '#'}
    try:
        return [e['name'] for e in dbx.listar(carpeta) if e['name'] in marcas]
    except DropboxError:
        return []


def avisar(dbx, conn, c, texto):
    """Deja el aviso en Dropbox (carpeta AVISOS de la primera cola) y en eventos, una vez por situación."""
    conn.commit()  # lo absorbido hasta aquí (anulaciones a mano) es real y se conserva
    if c.get('ultimo_aviso') == texto:
        return
    log.warning('%s: %s', c['comuna'], texto)
    db.evento(conn, 'aviso', c['comuna'], detalle=texto)
    conn.execute('UPDATE comunas SET ultimo_aviso=%s WHERE comuna=%s', (texto, c['comuna']))
    conn.commit()
    if c['colas']:
        ruta = '%s/AVISOS/%s_%s.txt' % (c['colas'][0], c['comuna'], datetime.datetime.now().strftime('%Y-%m-%d_%H%M'))
        try:
            dbx.subir(ruta, (texto + '\n').encode('utf-8'), 'overwrite', sobrescribir=True)
        except DropboxError as e:
            log.error('No se pudo dejar el aviso en Dropbox: %s', e)


def generar_comuna(dbx, office, conn, c, trabajo, reposo_min=10, resolucion=None):
    """Regenera la planilla de una comuna. Devuelve True si quedó actualizada en Dropbox.

    resolucion: qué hacer con lo que alguien escribió a mano desde la última generación.
      None        avisar y no tocar la planilla (el servicio)
      'importar'  las filas nuevas entran a la base como registros manuales
      'bd'        además, en las filas cambiadas prevalece la base de datos
      'planilla'  además, en las filas cambiadas prevalece lo escrito a mano
    """
    if not c['planilla']:
        log.info('%s: sin planilla configurada.', c['comuna'])
        return False
    if not db.registros_de(conn, c['comuna']) and not c['filas_generadas'] and resolucion is None:
        return False

    meta = dbx.metadata(c['planilla'])
    modificada = datetime.datetime.strptime(meta['server_modified'], '%Y-%m-%dT%H:%M:%SZ')
    minutos = (datetime.datetime.utcnow() - modificada).total_seconds() / 60
    if minutos < reposo_min:
        log.info('%s: la planilla cambió hace %d min; se espera.', c['comuna'], minutos)
        return False
    en_uso = planilla_en_uso(dbx, c['planilla'])
    if en_uso:
        log.info('%s: la planilla está abierta (%s); se espera.', c['comuna'], ', '.join(en_uso))
        return False

    carpeta = os.path.join(trabajo, c['comuna'])
    os.makedirs(carpeta, exist_ok=True)
    sello = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    datos, meta = dbx.descargar(c['planilla'])
    entrada = os.path.join(carpeta, '%s_antes_%s.xlsx' % (sello, meta['rev']))
    salida = os.path.join(carpeta, '%s_despues.xlsx' % sello)
    with open(entrada, 'wb') as f:
        f.write(datos)

    doc = office.abrir(entrada)
    try:
        coords = planilla.coordenadas(doc)
        actual = planilla.leer_filas(doc)
        base = {int(k): v for k, v in (c['filas_generadas'] or {}).items()}
        anuladas, nuevas, cambiadas, borradas = planilla.comparar(actual, base)
        registros = {r['fila']: r for r in db.registros_de(conn, c['comuna'])}

        # Una «Anulada» escrita a mano es la única edición que se absorbe sola: es lo que pide la instrucción 7.
        for fila in anuladas:
            if fila in registros and not registros[fila]['anulado_en']:
                db.anular(conn, registros[fila], 'planilla', 'Anulada a mano en la planilla')

        problemas = cambiadas + borradas
        if problemas and resolucion not in ('bd', 'planilla'):
            avisar(dbx, conn, c, 'Las filas %s del Parte diario fueron cambiadas o vaciadas a mano después de la última '
                   'generación. La planilla no se regenera hasta decidir con "parte resolver --comuna %s --prevalece bd|planilla".'
                   % (', '.join(map(str, problemas)), c['comuna']))
            return False
        if nuevas and resolucion is None:
            avisar(dbx, conn, c, 'Las filas %s del Parte diario fueron escritas a mano. La planilla no se regenera hasta '
                   'importarlas con "parte importar --comuna %s".' % (', '.join(map(str, nuevas)), c['comuna']))
            return False

        for fila in cambiadas:
            if resolucion == 'planilla':
                db.volver_manual(conn, registros[fila], actual[fila])
            else:
                db.evento(conn, 'bd_prevalece', c['comuna'], registros[fila]['id'], descartado=[str(x) for x in actual[fila]])
        for fila in borradas:
            if resolucion == 'planilla' and not registros[fila]['anulado_en']:
                db.anular(conn, registros[fila], 'planilla', 'Fila vaciada a mano en la planilla')
            elif resolucion == 'bd':
                db.evento(conn, 'bd_prevalece', c['comuna'], registros[fila]['id'], descartado='fila vaciada')

        # Filas escritas a mano: entran como registros manuales. Si una ocupa la fila ya asignada a un registro de la
        # app que todavía no estaba en la planilla, ese registro se corre al final.
        tope = max(list(registros) + list(actual) + [planilla.FILA_INICIO - 1]) + 1
        for fila in nuevas:
            if fila in registros:
                db.reubicar(conn, registros[fila], tope, c['prefijo'])
                tope += 1
            r = planilla.fila_a_registro(c['comuna'], c['prefijo'], fila, actual[fila])
            db.insertar_registro(conn, r)
            db.evento(conn, 'importado', c['comuna'], r['id'], detalle='fila %d' % fila)

        registros = {r['fila']: r for r in db.registros_de(conn, c['comuna'])}
        esperado = {f: planilla.valores(r, coords) for f, r in registros.items()}
        planilla.escribir_filas(doc, esperado)
        fotos = db.fotos_de(conn, c['comuna'])
        planilla.enlazar_fotos(doc, {f: fotos[r['id']] for f, r in registros.items()
                                     if r['id'] in fotos and not r['anulado_en']}, esperado)
        calculados = planilla.leer_calculados(doc, esperado)
        office.guardar_xlsx(doc, salida)
    finally:
        doc.close(True)

    with open(salida, 'rb') as f:
        try:
            subida = dbx.subir(c['planilla'], f.read(), {'.tag': 'update', 'update': meta['rev']})
        except DropboxError as e:
            if e.estado == 409:
                log.info('%s: la planilla cambió durante la generación; se reintenta en el próximo ciclo.', c['comuna'])
                conn.rollback()
                return False
            raise
    db.marcar_generada(conn, c['comuna'], subida['rev'], calculados, esperado)
    db.evento(conn, 'generada', c['comuna'], rev=subida['rev'], filas=len(esperado),
              por_corregir=sum(1 for v in calculados.values() if v[2] not in ('OK', 'Anulada')))
    conn.commit()
    log.info('%s: planilla regenerada con %d fila(s); revisión %s.', c['comuna'], len(esperado), subida['rev'])

    if c['colas']:
        try:
            dbx.subir('%s/estado/%s.json' % (c['colas'][0], c['comuna']), db.estado_json(conn, c['comuna']).encode('utf-8'),
                      'overwrite', sobrescribir=True)
        except DropboxError as e:
            log.error('No se pudo publicar el estado: %s', e)
    for viejo in sorted(f for f in os.listdir(carpeta) if f.endswith('.xlsx'))[:-20]:
        os.remove(os.path.join(carpeta, viejo))  # copias locales de trabajo; el historial real está en Dropbox
    return True
