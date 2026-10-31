"""Comandos del parte diario. Se ejecuta con el Python que tiene «uno» (el de LibreOffice o python3-uno).

  parte migrar                      crea o actualiza el esquema y carga comunas.json
  parte ciclo                       servicio: ingesta y genera cada PARTE_INTERVALO segundos
  parte ingestar [--comuna X]       una pasada de la cola a la base de datos
  parte generar  [--comuna X]       una regeneración de la(s) planilla(s)
  parte anular TOC-P0012 --por correo --motivo "..."
  parte importar --comuna X         importa las filas escritas a mano que haya en la planilla
  parte resolver --comuna X --prevalece bd|planilla   decide sobre filas cambiadas a mano
  parte estado   --comuna X         lista las filas y lo que dice Control
  parte respaldar                   pg_dump a Dropbox
"""
import argparse
import datetime
import json
import logging
import os
import subprocess
import sys
import time

from . import db
from .dropbox import Dropbox, DropboxError
from .office import Office

log = logging.getLogger('parte')


def config_comunas():
    ruta = os.environ.get('PARTE_COMUNAS') or '/etc/parte-diario/comunas.json'
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def trabajo():
    t = os.environ.get('PARTE_TRABAJO') or '/var/lib/parte-diario'
    os.makedirs(t, exist_ok=True)
    return t


def seleccion(conn, nombre):
    return [db.comuna(conn, nombre)] if nombre else db.comunas(conn)


def pasada(dbx, office, conn, comuna=None, generar_siempre=False, resolucion=None):
    from .generar import generar_comuna
    from .ingestar import ingestar_comuna
    reposo = int(os.environ.get('PARTE_REPOSO_MIN') or 10)
    for c in seleccion(conn, comuna):
        try:
            ingestar_comuna(dbx, conn, c)
            c = db.comuna(conn, c['comuna'])
            if generar_siempre or db.pendiente_de_generar(conn, c):
                generar_comuna(dbx, office, conn, c, trabajo(), reposo, resolucion)
        except Exception:
            conn.rollback()
            log.exception('%s: la pasada falló; se reintenta en el próximo ciclo.', c['comuna'])


def respaldar(dbx):
    carpeta = os.environ.get('PARTE_RESPALDO_DROPBOX')
    if not carpeta:
        log.info('Sin PARTE_RESPALDO_DROPBOX: no se respalda.')
        return
    nombre = 'parte_diario_%s.sql.gz' % datetime.datetime.now().strftime('%Y-%m-%d')
    dump = subprocess.run(['pg_dump', '--no-owner', os.environ.get('PARTE_DB') or ''], check=True, capture_output=True).stdout
    import gzip
    dbx.subir('%s/%s' % (carpeta.rstrip('/'), nombre), gzip.compress(dump), 'overwrite', sobrescribir=True)
    log.info('Respaldo %s subido a Dropbox.', nombre)


def main(argv=None):
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    ap = argparse.ArgumentParser(prog='parte', description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('migrar')
    sub.add_parser('ciclo')
    for n in ('ingestar', 'generar', 'importar', 'estado', 'resolver'):
        p = sub.add_parser(n)
        p.add_argument('--comuna', required=n in ('importar', 'estado', 'resolver'))
        if n == 'resolver':
            p.add_argument('--prevalece', choices=('bd', 'planilla'), required=True)
    p = sub.add_parser('anular')
    p.add_argument('id_planilla')
    p.add_argument('--por', required=True, help='correo de quien anula')
    p.add_argument('--motivo', required=True)
    sub.add_parser('respaldar')
    args = ap.parse_args(argv)

    conn = db.conectar()
    if args.cmd == 'migrar':
        db.migrar(conn)
        db.sembrar_comunas(conn, config_comunas())
        print('Esquema al día. Comunas:', ', '.join(c['comuna'] for c in db.comunas(conn)))
        return
    db.sembrar_comunas(conn, config_comunas())

    if args.cmd == 'anular':
        r = db.buscar(conn, args.id_planilla)
        if not r:
            sys.exit('No existe %s.' % args.id_planilla)
        db.anular(conn, r, args.por, args.motivo)
        conn.commit()
        print('%s anulado. La planilla se actualiza en el próximo ciclo.' % args.id_planilla)
        return
    if args.cmd == 'estado':
        for r in db.registros_de(conn, args.comuna):
            print('%s  fila %4d  %s  %-9s %-22s %-8s %s' % (r['id_planilla'], r['fila'], r['fecha'], r['punto'], r['hecho'][:22],
                                                           'Anulada' if r['anulado_en'] else '', r['control'] or '(sin generar)'))
        return

    dbx = Dropbox()
    if args.cmd == 'respaldar':
        respaldar(dbx)
        return
    if args.cmd in ('importar', 'resolver'):
        with Office() as office:
            pasada(dbx, office, conn, args.comuna, generar_siempre=True,
                   resolucion='importar' if args.cmd == 'importar' else args.prevalece)
        return
    if args.cmd in ('ingestar', 'generar'):
        with Office() as office:
            if args.cmd == 'ingestar':
                from .ingestar import ingestar_comuna
                for c in seleccion(conn, args.comuna):
                    ingestar_comuna(dbx, conn, c)
            else:
                pasada(dbx, office, conn, args.comuna, generar_siempre=True)
        return

    # ciclo: el servicio. LibreOffice se reinicia cada tantas pasadas para no acumular memoria.
    intervalo = int(os.environ.get('PARTE_INTERVALO') or 60)
    hora_respaldo = os.environ.get('PARTE_RESPALDO_HORA') or '03:30'
    ultimo_respaldo = None
    log.info('Servicio iniciado: cada %ds. Comunas: %s', intervalo, ', '.join(c['comuna'] for c in db.comunas(conn)))
    while True:
        try:
            with Office() as office:
                for _ in range(50):
                    pasada(dbx, office, conn)
                    # Cierra la transacción de lectura que deja la pasada: si queda abierta durante la espera, now() se congela
                    # y recibido_en/actualizado_en del próximo ciclo saldrían con la hora de este.
                    conn.rollback()
                    hoy = datetime.date.today()
                    if ultimo_respaldo != hoy and datetime.datetime.now().strftime('%H:%M') >= hora_respaldo:
                        try:
                            respaldar(dbx)
                        except Exception:
                            log.exception('El respaldo falló.')
                        ultimo_respaldo = hoy
                    time.sleep(intervalo)
        except (DropboxError, OSError, RuntimeError):
            log.exception('Error del servicio; se reintenta en %ds.', intervalo)
            time.sleep(intervalo)
        except KeyboardInterrupt:
            return


if __name__ == '__main__':
    main()
