#!/usr/bin/env python3
"""Genera el contrato de datos del levantamiento (src/evidencias-assets/levantamiento.json) desde el formulario DEC-020.

Las columnas amarillas S..BU de la hoja «Levantamiento» son el contrato entre la app de terreno y la planilla: este script
las lee tal como están (encabezado, lista o tipo de su validación) junto con los datos precargados A..R de cada punto,
para que la app pida exactamente lo mismo que la planilla y el servicio escriba cada valor en su columna. Solo usa la
biblioteca estándar. Si el formulario cambia, se vuelve a correr (la app y el servicio usan una copia cada uno):

    python3 tools/parte-diario/contrato_levantamiento.py <formulario.xlsx> \
        src/evidencias-assets/levantamiento.json tools/parte-diario/parte/levantamiento_contrato.json
"""
import html
import json
import re
import sys
import zipfile

HOJA = 'Levantamiento'
FILA_ENCABEZADO, FILA_INICIO = 4, 5
CALCULADAS = {'BP', 'BQ', 'BV'}           # ángulos LPR y «Control»: fórmulas de la planilla, no se capturan
PRECARGADAS = 'ABCDEFGHIJKLMNOPQR'
# Lo que «Control» exige (mismas columnas que su fórmula), para que la app muestre el mismo estado
OBLIGATORIAS = ['S', 'T', 'U', 'V', 'W', 'Y', 'Z', 'AG', 'AH', 'AJ', 'BS']
OBLIGATORIAS_LPR = ['BE', 'BF', 'BH', 'BM', 'BN', 'BO']
GRUPOS = [
    ('Ubicación', 'S', 'AC'), ('Faja y organismo', 'AD', 'AI'), ('Fundación', 'AJ', 'AL'),
    ('Redes y cruces', 'AM', 'AS'), ('Energía', 'AT', 'AW'), ('Enlace y señal', 'AX', 'BA'),
    ('Entorno y riesgos', 'BB', 'BD'), ('Pórtico LPR', 'BE', 'BR'), ('Cierre', 'BS', 'BU'),
]
AYUDAS = {
    'U': 'De pie en el lugar propuesto para el poste, en grados decimales.',
    'V': 'De pie en el lugar propuesto para el poste, en grados decimales.',
    'AA': 'Si hay un hito a la vista: ruta, km y distancia al hito. En tramos urbanos sin hito basta la coordenada.',
    'AD': 'Desde la berma o la vereda, con telémetro láser, sin ocupar la calzada.',
    'AR': 'Vialidad exige 6,0 m (Instructivo de Paralelismos y Atraviesos); el pliego de CGE pide 4,5 m.',
    'AH': 'Lo que se observa en terreno. No cambia la jurisdicción confirmada, que solo la da Vialidad.',
    'BA': 'Operador y barras o dBm, de cada operador.',
    'BJ': 'Recta libre antes del punto de lectura.',
    'BM': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'BN': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'BO': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'BR': 'Solo si el brazo queda sobre la calzada de una ruta.',
    'BS': 'Se cuenta solo con las fotos guiadas (mínimo 3).',
}
# Puntos sin solución de comunicaciones en la oferta: ahí se anota la señal de cada operador (instrucción 13)
SIN_SOLUCION = ['ANT-L02', 'ANT-L03', 'ANT-122', 'TOC-L04', 'TOC-L05']
FOTOS = [
    {'code': 'L1', 'label': 'Sitio del poste', 'hint': 'Panorámica de pie en el lugar propuesto para el poste.', 'required': True},
    {'code': 'L2', 'label': 'Hacia la calzada o berma', 'hint': 'Muestra la distancia a la calzada, la berma o la cuneta.', 'required': True},
    {'code': 'L3', 'label': 'Poste CGE o red BT más cercana', 'hint': 'Con la placa legible si se puede.', 'required': True},
    {'code': 'L4', 'label': 'Hito km o referencia de dirección', 'hint': 'Si hay hito o numeración a la vista.'},
    {'code': 'L5', 'label': 'Línea de vista al punto del enlace', 'hint': 'Hacia el punto indicado en «Enlace según la oferta».', 'when': 'enlace'},
    {'code': 'L6', 'label': 'LPR · vía hacia el poste, sentido 1', 'hint': 'Desde el punto de lectura hacia el poste.', 'when': 'lpr'},
    {'code': 'L7', 'label': 'LPR · vía hacia el poste, sentido 2', 'hint': 'Desde el punto de lectura hacia el poste.', 'when': 'lpr'},
    {'code': 'L8', 'label': 'Obstáculos o riesgos', 'hint': 'Árboles, señales, paraderos, accesos o lo que afecte la obra.'},
]


def col_num(c):
    n = 0
    for ch in c:
        n = n * 26 + ord(ch) - 64
    return n


def col_letra(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def main(entrada, salidas):
    z = zipfile.ZipFile(entrada)
    ss = [html.unescape(''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S)))
          for si in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode(), re.S)]
    wb = z.read('xl/workbook.xml').decode()
    rels = z.read('xl/_rels/workbook.xml.rels').decode()
    rid = re.search(r'<sheet [^>]*name="%s"[^>]*r:id="([^"]+)"' % HOJA, wb).group(1)
    target = re.search(r'<Relationship [^>]*Id="%s"[^>]*Target="([^"]+)"' % rid, rels) or \
        re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]*Id="%s"' % rid, rels)
    hoja = 'xl/' + target.group(1).lstrip('/').removeprefix('xl/')
    x = z.read(hoja).decode()

    celdas = {}
    for c in re.finditer(r'<c r="([A-Z]+)(\d+)"([^>]*?)(?:/>|>(.*?)</c>)', x, re.S):
        v = re.search(r'<v>(.*?)</v>', c.group(4) or '', re.S)
        if v:
            celdas[(c.group(1), int(c.group(2)))] = ss[int(v.group(1))] if 't="s"' in c.group(3) else html.unescape(v.group(1))

    validaciones = {}
    for dv in re.findall(r'<dataValidation\b(.*?)</dataValidation>', x, re.S):
        attrs = dict(re.findall(r'(\w+)="([^"]*)"', dv.split('>')[0]))
        f1 = re.search(r'<formula1>(.*?)</formula1>', dv, re.S)
        col = re.match(r'([A-Z]+)', attrs['sqref']).group(1)
        validaciones[col] = (attrs.get('type'), html.unescape(f1.group(1)) if f1 else '')

    # Enlaces «Abrir» de la columna J: el mapa de la coordenada del KMZ
    hrels = {}
    nombre = hoja.rsplit('/', 1)[1]
    ruta_rels = hoja.replace(nombre, '_rels/' + nombre + '.rels')
    if ruta_rels in z.namelist():
        hrels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read(ruta_rels).decode()))
    mapas = {re.match(r'[A-Z]+(\d+)', ref).group(1): html.unescape(hrels.get(r, ''))
             for ref, r in re.findall(r'<hyperlink ref="([A-Z]+\d+)" r:id="([^"]+)"', x)}

    ultima = col_num('BU')
    campos = []
    for n in range(col_num('S'), ultima + 1):
        col = col_letra(n)
        if col in CALCULADAS:
            continue
        tipo, f1 = validaciones.get(col, (None, ''))
        campo = {'col': col, 'label': celdas[(col, FILA_ENCABEZADO)]}
        if tipo == 'list':
            campo['type'] = 'list'
            campo['options'] = [o.strip() for o in f1.strip('"').split(',')]
        elif tipo == 'date':
            campo['type'] = 'date'
        elif tipo == 'decimal':
            campo['type'] = 'decimal'
        elif tipo == 'whole':
            campo['type'] = 'whole'
        else:
            campo['type'] = 'text'
        campo['group'] = next(g for g, a, b in GRUPOS if col_num(a) <= n <= col_num(b))
        if col in OBLIGATORIAS:
            campo['required'] = True
        if col in OBLIGATORIAS_LPR:
            campo['requiredLpr'] = True
        if col_num('BE') <= n <= col_num('BR'):
            campo['when'] = 'lpr'
        if col in ('AX', 'AY', 'AZ'):
            campo['when'] = 'enlace'
        if col in AYUDAS:
            campo['hint'] = AYUDAS[col]
        campos.append(campo)

    precargadas = [{'col': c, 'label': celdas[(c, FILA_ENCABEZADO)]} for c in PRECARGADAS]
    puntos = []
    fila = FILA_INICIO
    while (('A', fila) in celdas):
        p = {'fila': fila, **{c: celdas.get((c, fila), '') for c in PRECARGADAS}}
        p['J'] = mapas.get(str(fila), '')
        p['lpr'] = p['D'] == 'Pórtico lector de patentes'
        p['enlace'] = p['M'] in ('Radio', 'Sin trazado en el KMZ de la oferta')
        p['sinSolucion'] = p['A'] in SIN_SOLUCION
        puntos.append(p)
        fila += 1

    contrato = {
        'fuente': entrada.rsplit('/', 1)[-1],
        'hoja': HOJA, 'filaEncabezado': FILA_ENCABEZADO, 'filaInicio': FILA_INICIO,
        'levantadores': validaciones['T'][1].strip('"').split(','),
        'fechaMinima': validaciones['S'][1],
        'precargadas': precargadas, 'campos': campos, 'fotos': FOTOS, 'puntos': puntos,
    }
    for salida in salidas:
        with open(salida, 'w', encoding='utf-8') as f:
            json.dump(contrato, f, ensure_ascii=False, indent=1)
            f.write('\n')
    print('%d campos, %d puntos, %d fotos guiadas → %s' % (len(campos), len(puntos), len(FOTOS), ', '.join(salidas)))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
