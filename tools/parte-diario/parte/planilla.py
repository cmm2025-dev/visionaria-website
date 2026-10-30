"""La hoja «Parte diario»: qué se escribe en cada fila y cómo se lee lo que hay."""
import datetime
import math
import re
import urllib.parse

HOJA = 'Parte diario'
FILA_INICIO, FILA_FIN = 5, 3004          # filas de datos (1-based), según la planilla
COL_B, COL_H = 1, 7                      # columnas de ingreso B..H (0-based: 1..7)
FECHA_BASE = datetime.date(1899, 12, 30)  # día 0 de las fechas de Excel y LibreOffice


def serial(fecha):
    return (fecha - FECHA_BASE).days


def fecha_de(valor):
    """Celda de fecha leída por UNO: número de serie, o texto si alguien la escribió mal."""
    if isinstance(valor, float) and valor > 0:
        return FECHA_BASE + datetime.timedelta(days=int(valor))
    return None


def distancia_m(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def detalle(r, coords_punto):
    """Observación del técnico, ubicación y quién registró."""
    if r['origen'] == 'manual':
        return r.get('detalle_manual') or ''
    partes = []
    if (r.get('observacion') or '').strip():
        partes.append(r['observacion'].strip())
    if r.get('gps_lat') is not None:
        etiqueta = 'Ubicación al registrar' if r.get('gps_origen') == 'gallery' else 'GPS'
        partes.append('%s %.5f, %.5f ±%d m' % (etiqueta, r['gps_lat'], r['gps_lon'], r.get('gps_precision') or 0))
        if coords_punto:
            d = distancia_m(r['gps_lat'], r['gps_lon'], *coords_punto)
            partes.append('a %d m del punto KMZ' % round(d) if d < 1000 else
                          'a %s km del punto KMZ' % ('%.1f' % (d / 1000)).replace('.', ','))
    else:
        partes.append('Sin GPS')
    usuario = (r.get('registrado_por') or '').split('@')[0]
    if usuario:
        partes.append('registró ' + usuario)
    return ' · '.join(partes)


def valores(r, coords):
    """Los siete valores B..H de un registro, con los tipos que escribe y lee UNO (número o texto)."""
    return [float(serial(r['fecha'])), r['punto'], r['hecho'], r.get('ejecuto') or '', detalle(r, coords.get(r['punto'])),
            r.get('foto') or '', 'Anulada' if r.get('anulado_en') else '']


def coordenadas(doc):
    """Latitud y longitud de cada punto, desde la hoja «Puntos»."""
    coords = {}
    for f in doc.Sheets.getByName('Puntos').getCellRangeByName('A2:E400').getDataArray():
        if f[0] and isinstance(f[3], float) and isinstance(f[4], float) and (f[3] or f[4]):
            coords[f[0]] = (f[3], f[4])
    return coords


def leer_filas(doc):
    """{fila: [B..H]} de las filas con algo escrito."""
    hoja = doc.Sheets.getByName(HOJA)
    datos = hoja.getCellRangeByName('B%d:H%d' % (FILA_INICIO, FILA_FIN)).getDataArray()
    return {FILA_INICIO + i: list(f) for i, f in enumerate(datos) if any(v not in ('', None) for v in f)}


def comparar(actual, base):
    """Qué cambió a mano desde la última generación: compara lo que hay con lo que el sistema escribió.

    Devuelve (anuladas, nuevas, cambiadas, borradas). «anuladas» son filas cuya única diferencia es «Anulada»
    en H: se absorben como anulación. Las otras tres son ediciones manuales que requieren decisión."""
    anuladas, nuevas, cambiadas = [], [], []
    for fila, v in sorted(actual.items()):
        if fila not in base:
            nuevas.append(fila)
        elif v != base[fila]:
            if v[:6] == base[fila][:6] and v[6] == 'Anulada' and base[fila][6] == '':
                anuladas.append(fila)
            else:
                cambiadas.append(fila)
    borradas = sorted(f for f in base if f not in actual)
    return anuladas, nuevas, cambiadas, borradas


def escribir_filas(doc, esperado):
    """Escribe B..H de todas las filas conocidas en una sola operación."""
    if not esperado:
        return
    hoja = doc.Sheets.getByName(HOJA)
    ultima = max(esperado)
    vacio = ['', '', '', '', '', '', '']
    datos = tuple(tuple(esperado.get(f, vacio)) for f in range(FILA_INICIO, ultima + 1))
    hoja.getCellRangeByName('B%d:H%d' % (FILA_INICIO, ultima)).setDataArray(datos)
    # setDataArray deja texto vacío donde pusimos '': se limpian para que queden realmente vacías y COUNTA no las cuente.
    for f in range(FILA_INICIO, ultima + 1):
        for c, v in enumerate(esperado.get(f, vacio), start=COL_B):
            if v == '':
                hoja.getCellByPosition(c, f - 1).clearContents(1 | 2 | 4 | 16)  # VALUE|DATETIME|STRING|FORMULA


ENLACE = re.compile(r'^=HYPERLINK\("[^"]*";(.*)\)$', re.S)


def url_dropbox(ruta):
    """Enlace web a la foto: abre la vista previa en Dropbox para quien tenga acceso a la carpeta."""
    carpeta, _, nombre = ruta.rpartition('/')
    return 'https://www.dropbox.com/home%s?preview=%s' % (urllib.parse.quote(carpeta), urllib.parse.quote(nombre))


def enlazar_fotos(doc, enlaces, filas):
    """Convierte I (Nombre de la foto) en hipervínculo a la foto en Dropbox, conservando la fórmula de la planilla.

    enlaces: {fila: ruta de la foto}. Las demás filas de «filas» vuelven a la fórmula sin enlace."""
    hoja = doc.Sheets.getByName(HOJA)
    for f in filas:
        celda = hoja.getCellByPosition(8, f - 1)
        formula = celda.getFormula()
        m = ENLACE.match(formula)
        original = '=' + m.group(1) if m else formula
        if not original.startswith('='):
            continue  # alguien reemplazó la fórmula por un valor: no se toca
        nueva = '=HYPERLINK("%s";%s)' % (url_dropbox(enlaces[f]), original[1:]) if f in enlaces else original
        if nueva != formula:
            celda.setFormula(nueva)


def leer_calculados(doc, filas):
    """Lo que la planilla calculó en A (ID), I (Nombre de la foto) y J (Control) para cada fila."""
    doc.calculateAll()
    hoja = doc.Sheets.getByName(HOJA)
    return {f: (hoja.getCellByPosition(0, f - 1).getString(), hoja.getCellByPosition(8, f - 1).getString(),
                hoja.getCellByPosition(9, f - 1).getString()) for f in filas}


def fila_a_registro(comuna, prefijo, fila, v):
    """Una fila escrita a mano, convertida en registro de origen manual para importarla."""
    fecha = fecha_de(v[0])
    return {'id': 'manual:%s:%d' % (comuna, fila), 'comuna': comuna, 'fila': fila, 'id_planilla': '%s-P%04d' % (prefijo, fila - 4),
            'fecha': fecha or FECHA_BASE, 'punto': str(v[1]), 'hecho': str(v[2]), 'tipo': None, 'ejecuto': str(v[3]) or None,
            'observacion': None, 'registrado_por': None, 'foto': str(v[5]), 'piloto': False, 'origen': 'manual',
            'detalle_manual': str(v[4]) + ('' if fecha else ' · [fecha ilegible al importar: %r]' % (v[0],)),
            'guardado_en': None, 'anulado_en': datetime.datetime.now().astimezone() if v[6] == 'Anulada' else None,
            'anulado_por': 'planilla' if v[6] == 'Anulada' else None, 'motivo_anulacion': None}
