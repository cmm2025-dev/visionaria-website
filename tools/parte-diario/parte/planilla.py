"""La hoja «Parte diario»: qué se escribe en cada fila y cómo se lee lo que hay."""
import contextlib
import datetime
import re
import urllib.parse

HOJA = 'Parte diario'
FILA_INICIO, FILA_FIN = 5, 3004          # filas de datos (1-based), según la planilla
COL_B, COL_H = 1, 7                      # columnas de ingreso B..H (0-based: 1..7)
FECHA_BASE = datetime.date(1899, 12, 30)  # día 0 de las fechas de Excel y LibreOffice
# Columnas que agrega el sistema a la derecha de la planilla (L..N). Solo las escribe el servicio: coordenadas sueltas
# para exportar el recorrido a KML/KMZ, y quién registró.
COL_EXTRA = 11
EXTRA = (('Latitud', 12), ('Longitud', 12), ('Registró', 30))


def serial(fecha):
    return (fecha - FECHA_BASE).days


def fecha_de(valor):
    """Celda de fecha leída por UNO: número de serie, o texto si alguien la escribió mal."""
    if isinstance(valor, float) and valor > 0:
        return FECHA_BASE + datetime.timedelta(days=int(valor))
    return None


def detalle(r):
    """Solo la observación del técnico; la ubicación y quién registró van en sus propias columnas (L..N)."""
    if r['origen'] == 'manual':
        return r.get('detalle_manual') or ''
    return (r.get('observacion') or '').strip()


def valores(r):
    """Los siete valores B..H de un registro, con los tipos que escribe y lee UNO (número o texto)."""
    return [float(serial(r['fecha'])), r['punto'], r['hecho'], r.get('ejecuto') or '', detalle(r),
            r.get('foto') or '', 'Anulada' if r.get('anulado_en') else '']


def extra(r):
    """Latitud, Longitud y Registró (L..N). Vacías si no hay GPS o el registro se escribió a mano."""
    sin_gps = r.get('gps_lat') is None or r.get('gps_lon') is None
    return ['' if sin_gps else float(r['gps_lat']), '' if sin_gps else float(r['gps_lon']), r.get('registrado_por') or '']


@contextlib.contextmanager
def sin_proteccion(hoja):
    """La hoja viene protegida sin contraseña (se protege para que no se escriba en lo gris). Se desprotege mientras
    el sistema escribe y se vuelve a proteger; LibreOffice conserva lo que la protección permite (filtrar, anchos)."""
    protegida = hoja.isProtected()
    if protegida:
        hoja.unprotect('')   # con contraseña esto falla, y la generación avisa del error en vez de escribir a medias
    try:
        yield
    finally:
        if protegida:
            hoja.protect('')


def preparar_extra(doc):
    """Agrega L..N con el formato de K (encabezado y celdas grises) y extiende el filtro hasta N. Solo la primera vez."""
    hoja = doc.Sheets.getByName(HOJA)
    if hoja.getCellByPosition(COL_EXTRA, FILA_INICIO - 2).getString() == EXTRA[0][0]:
        return
    fin = COL_EXTRA + len(EXTRA) - 1
    with sin_proteccion(hoja):
        modelo = hoja.getCellRangeByPosition(COL_EXTRA - 1, FILA_INICIO - 2, COL_EXTRA - 1, FILA_FIN - 1).RangeAddress
        for i, (titulo, ancho) in enumerate(EXTRA):
            col = COL_EXTRA + i
            destino = hoja.getCellByPosition(col, FILA_INICIO - 2).CellAddress
            hoja.copyRange(destino, modelo)   # trae formato, bloqueo y fórmula de K; la fórmula se borra abajo
            hoja.getCellByPosition(col, FILA_INICIO - 2).setString(titulo)
            hoja.Columns.getByIndex(col).Width = ancho * 250   # 1/100 mm; ~ el ancho en caracteres de Excel
        datos = hoja.getCellRangeByPosition(COL_EXTRA, FILA_INICIO - 1, fin, FILA_FIN - 1)
        datos.clearContents(1 | 2 | 4 | 16)
        coords = hoja.getCellRangeByPosition(COL_EXTRA, FILA_INICIO - 1, COL_EXTRA + 1, FILA_FIN - 1)
        formatos, local = doc.NumberFormats, doc.CharLocale
        clave = formatos.queryKey('0.000000', local, False)
        coords.NumberFormat = clave if clave != -1 else formatos.addNew('0.000000', local)
        rangos = doc.getPropertyValue('UnnamedDatabaseRanges')
        if rangos.hasByTable(hoja.RangeAddress.Sheet):
            rango = rangos.getByTable(hoja.RangeAddress.Sheet)
            area = rango.DataArea
            if area.EndColumn < fin:
                area.EndColumn = fin
                rango.DataArea = area
                rango.AutoFilter = True


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


def escribir_extra(doc, extras):
    """Escribe L..N ({fila: [lat, lon, registró]}); a diferencia de B..H, no se comparan: el sistema siempre las repone."""
    if not extras:
        return
    hoja = doc.Sheets.getByName(HOJA)
    ultima = max(extras)
    vacio = [''] * len(EXTRA)
    fin = COL_EXTRA + len(EXTRA) - 1
    datos = tuple(tuple(extras.get(f, vacio)) for f in range(FILA_INICIO, ultima + 1))
    with sin_proteccion(hoja):   # son celdas bloqueadas: UNO rechaza setDataArray en ellas con la hoja protegida
        hoja.getCellRangeByPosition(COL_EXTRA, FILA_INICIO - 1, fin, ultima - 1).setDataArray(datos)
        for f in range(FILA_INICIO, ultima + 1):
            for c, v in enumerate(extras.get(f, vacio), start=COL_EXTRA):
                if v == '':
                    hoja.getCellByPosition(c, f - 1).clearContents(1 | 2 | 4 | 16)


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
