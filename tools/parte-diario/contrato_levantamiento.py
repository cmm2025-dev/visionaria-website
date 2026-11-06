#!/usr/bin/env python3
"""Genera el contrato de datos del levantamiento desde las planillas de terreno: DEC-020 y vía rápida.

Las columnas amarillas de cada planilla (de «Fecha» a «¿Hay que volver?») son el contrato entre la app de terreno y la
planilla. Se leen por el nombre del encabezado, nunca por su posición: este script toma de cada hoja los encabezados,
las listas y tipos de sus validaciones, los datos precargados y la asignación de cada punto, y les suma las reglas de
«Control» y «Trámite resultante» con los mismos textos de las fórmulas, para que la app calcule lo mismo que la
planilla. Solo usa la biblioteca estándar. Si una planilla cambia, se vuelve a correr (la app y el servicio usan una
copia cada uno):

    python3 tools/parte-diario/contrato_levantamiento.py \\
        --dec020 <formulario DEC-020.xlsx> \\
        --via-rapida Antofagasta=<…_Antofagasta.xlsx> --via-rapida Calama=<…> --via-rapida Tocopilla=<…> \\
        src/evidencias-assets/levantamiento.json tools/parte-diario/parte/levantamiento_contrato.json
"""
import argparse
import html
import json
import os
import re
import zipfile

FILA_ENCABEZADO, FILA_INICIO = 4, 5
PRIMER_CAMPO, ULTIMO_CAMPO = 'Fecha', '¿Hay que volver?'
HOJAS_VIA_RAPIDA = ['Vía rápida probable', 'Revisar', 'Trámite largo probable', 'Por ubicar']

# Encabezados con significado para las reglas; son los mismos textos en las dos planillas.
CODIGO, MAPA, CONEXION = 'Código', 'Mapa', 'Conexión según la oferta'
LO_LEVANTA = 'Lo levanta'
FOTOS_N = 'Fotos tomadas (N°)'
OBLIGATORIOS = ['Fecha', 'Levantó', 'Latitud medida', 'Longitud medida', 'Ubicación frente al KMZ', 'Sector', 'Tipo de vía',
                'Dentro de la faja o a menos de 20 m', 'Organismo que autoriza (según terreno)', 'Dónde va la fundación', FOTOS_N]
OBLIGATORIOS_LPR = ['LPR: sentidos a leer', 'LPR: pistas por sentido', 'LPR: poste propuesto en',
                    'LPR: altura de montaje de las cámaras (m)', 'LPR: distancia de captura (m)',
                    'LPR: distancia lateral a la pista más lejana (m)']
# Ficha rápida de vía rápida: los datos que deciden el trámite, en el orden del prompt (§5.2).
FICHA_RAPIDA = ['Dónde va la fundación', 'Material', '¿Hay rotura de pavimento?', 'Red BT de CGE',
                'Poste CGE más cercano (N° de placa)', 'Distancia al poste CGE (m)', 'Dentro de la faja o a menos de 20 m',
                'Organismo que autoriza (según terreno)', 'Latitud medida', 'Longitud medida']
GRUPOS = [  # por encabezado de inicio; cada campo cae en el último grupo que empezó antes que él (orden de la hoja DEC-020)
    ('Fecha', 'Ubicación'), ('Distancia a la calzada (m)', 'Faja y organismo'), ('Dónde va la fundación', 'Fundación'),
    ('Postes existentes (dueño y N° de placa)', 'Redes y cruces'), ('Alimentación posible', 'Energía'),
    ('Línea de vista al punto del enlace', 'Enlace y señal'), ('¿Obras o proyectos de mejoramiento a la vista?', 'Entorno y riesgos'),
    ('LPR: sentidos a leer', 'Pórtico LPR'), (FOTOS_N, 'Cierre'),
]
AYUDAS = {
    'Latitud medida': 'De pie en el lugar propuesto para el poste, en grados decimales.',
    'Longitud medida': 'De pie en el lugar propuesto para el poste, en grados decimales.',
    'Ruta e hito km más cercano': 'Si hay un hito a la vista: ruta, km y distancia al hito. En tramos urbanos sin hito basta la coordenada.',
    'Distancia a la calzada (m)': 'Desde la berma o la vereda, con telémetro láser, sin ocupar la calzada.',
    'Altura libre en el cruce (m)': 'Vialidad exige 6,0 m (Instructivo de Paralelismos y Atraviesos); el pliego de CGE pide 4,5 m.',
    'Organismo que autoriza (según terreno)': 'Lo que se observa en terreno. No cambia la jurisdicción confirmada, que solo la da Vialidad.',
    'Distancia al poste CGE (m)': 'Con telémetro o huincha, o con los dos botones de GPS (poste nuevo y poste CGE).',
    'Señal celular (operador y barras o dBm)': 'Operador y barras o dBm, de cada operador.',
    'LPR: recta libre antes del punto de lectura (m)': 'Recta libre antes del punto de lectura.',
    'LPR: altura de montaje de las cámaras (m)': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'LPR: distancia de captura (m)': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'LPR: distancia lateral a la pista más lejana (m)': 'Los ángulos deben quedar bajo 30° (mejor bajo 20°).',
    'LPR: altura libre bajo el brazo (m)': 'Solo si el brazo queda sobre la calzada de una ruta.',
    FOTOS_N: 'Se cuenta solo con las fotos guiadas (mínimo 3).',
}
SIN_SOLUCION_DEC020 = ['ANT-L02', 'ANT-L03', 'ANT-122', 'TOC-L04', 'TOC-L05']
FOTOS_DEC020 = [
    {'code': 'L1', 'label': 'Sitio del poste', 'hint': 'Panorámica de pie en el lugar propuesto para el poste.', 'required': True},
    {'code': 'L2', 'label': 'Hacia la calzada o berma', 'hint': 'Muestra la distancia a la calzada, la berma o la cuneta.', 'required': True},
    {'code': 'L3', 'label': 'Poste CGE o red BT más cercana', 'hint': 'Con la placa legible si se puede.', 'required': True},
    {'code': 'L4', 'label': 'Hito km o referencia de dirección', 'hint': 'Si hay hito o numeración a la vista.'},
    {'code': 'L5', 'label': 'Línea de vista al punto del enlace', 'hint': 'Hacia el punto indicado en «Enlace según la oferta».', 'when': 'enlace'},
    {'code': 'L6', 'label': 'LPR · vía hacia el poste, sentido 1', 'hint': 'Desde el punto de lectura hacia el poste.', 'when': 'lpr'},
    {'code': 'L7', 'label': 'LPR · vía hacia el poste, sentido 2', 'hint': 'Desde el punto de lectura hacia el poste.', 'when': 'lpr'},
    {'code': 'L8', 'label': 'Obstáculos o riesgos', 'hint': 'Árboles, señales, paraderos, accesos o lo que afecte la obra.'},
]
FOTOS_VIA_RAPIDA = [
    {'code': 'V1', 'label': 'Suelo en el lugar del poste', 'hint': 'Dónde va la fundación: vereda, tierra, área verde…', 'required': True},
    {'code': 'V2', 'label': 'Poste CGE y su placa', 'hint': 'El poste más cercano, con el número de placa legible.', 'required': True},
    {'code': 'V3', 'label': 'Panorámica del sitio', 'hint': 'De pie en el lugar propuesto para el poste.', 'required': True},
    {'code': 'V4', 'label': 'Línea de vista al punto del enlace', 'hint': 'Hacia el punto indicado en «Enlace según la oferta».', 'when': 'enlace'},
    {'code': 'V5', 'label': 'Obstáculos o riesgos', 'hint': 'Árboles, paraderos, accesos o lo que afecte la obra.'},
]


def col_num(c):
    n = 0
    for ch in c:
        n = n * 26 + ord(ch) - 64
    return n


class Libro:
    """Lectura mínima de un xlsx: celdas (valor y si es fórmula), validaciones e hipervínculos por hoja."""

    def __init__(self, ruta):
        self.z = zipfile.ZipFile(ruta)
        names = self.z.namelist()
        self.ss = [html.unescape(''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S)))
                   for si in re.findall(r'<si>(.*?)</si>', self.z.read('xl/sharedStrings.xml').decode(), re.S)] \
            if 'xl/sharedStrings.xml' in names else []
        wb = self.z.read('xl/workbook.xml').decode()
        rels = self.z.read('xl/_rels/workbook.xml.rels').decode()
        rm = {}
        for rel in re.findall(r'<Relationship [^>]*>', rels):
            rid, tgt = re.search(r'Id="([^"]+)"', rel).group(1), re.search(r'Target="([^"]+)"', rel).group(1)
            rm[rid] = tgt
        self.hojas = {html.unescape(n): 'xl/' + rm[r].lstrip('/').removeprefix('xl/')
                      for n, r in re.findall(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wb)}

    def hoja(self, nombre):
        ruta = self.hojas[nombre]
        x = self.z.read(ruta).decode()
        celdas = {}
        # Cada celda por separado: una celda vacía se cierra con «/>» y no debe comerse a la siguiente.
        for c in re.finditer(r'<c r="([A-Z]+)(\d+)"([^>]*?)(?:/>|>(.*?)</c>)', x, re.S):
            cuerpo = c.group(4) or ''
            v = re.search(r'<v>(.*?)</v>', cuerpo, re.S)
            t = re.search(r'<is>.*?<t[^>]*>(.*?)</t>', cuerpo, re.S)
            valor = (self.ss[int(v.group(1))] if 't="s"' in c.group(3) else html.unescape(v.group(1))) if v else \
                (html.unescape(t.group(1)) if t else '')
            celdas[(c.group(1), int(c.group(2)))] = {'v': valor, 'f': '<f' in cuerpo}
        validaciones = {}
        for dv in re.findall(r'<dataValidation\b(.*?)</dataValidation>', x, re.S):
            attrs = dict(re.findall(r'(\w+)="([^"]*)"', dv.split('>')[0]))
            f1 = re.search(r'<formula1>(.*?)</formula1>', dv, re.S)
            validaciones[re.match(r'([A-Z]+)', attrs['sqref']).group(1)] = (attrs.get('type'), html.unescape(f1.group(1)) if f1 else '')
        nombre_archivo = ruta.rsplit('/', 1)[1]
        ruta_rels = ruta.replace(nombre_archivo, '_rels/' + nombre_archivo + '.rels')
        hrels = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', self.z.read(ruta_rels).decode())) if ruta_rels in self.z.namelist() else {}
        enlaces = {ref: html.unescape(hrels.get(r, '')) for ref, r in re.findall(r'<hyperlink ref="([A-Z]+\d+)" r:id="([^"]+)"', x)}
        return celdas, validaciones, enlaces


def grupo_de(encabezado, orden):
    """El grupo de un campo según su posición respecto de los inicios de grupo (orden: encabezados en orden de hoja)."""
    actual = GRUPOS[0][1]
    for inicio, nombre in GRUPOS:
        if inicio in orden and orden.index(inicio) <= orden.index(encabezado):
            actual = nombre
    return actual


def leer_formulario(ruta, hojas, id_, titulo, tipo, comuna=None):
    libro = Libro(ruta)
    campos, precargadas, asignacion, puntos, levantadores = None, None, None, [], set()
    fecha_minima = None
    for nombre in hojas:
        if nombre not in libro.hojas:
            continue
        celdas, validaciones, enlaces = libro.hoja(nombre)
        encabezados = {}
        c = 1
        while (letra := _letra(c)) and ((letra, FILA_ENCABEZADO) in celdas or c < 3):
            if (letra, FILA_ENCABEZADO) in celdas and celdas[(letra, FILA_ENCABEZADO)]['v']:
                encabezados[celdas[(letra, FILA_ENCABEZADO)]['v']] = letra
            c += 1
        orden = sorted(encabezados, key=lambda h: col_num(encabezados[h]))
        i0, i1 = orden.index(PRIMER_CAMPO), orden.index(ULTIMO_CAMPO)
        calculadas = {h for h in orden if celdas.get((encabezados[h], FILA_INICIO), {}).get('f')}
        hoja_campos = []
        for h in orden[i0:i1 + 1]:
            if h in calculadas:
                continue
            letra = encabezados[h]
            tipo_v, f1 = validaciones.get(letra, (None, ''))
            campo = {'key': h, 'col': letra, 'type': {'list': 'list', 'date': 'date', 'decimal': 'decimal', 'whole': 'whole'}.get(tipo_v, 'text'),
                     'group': grupo_de(h, orden)}
            if tipo_v == 'list':
                campo['options'] = [o.strip() for o in f1.strip('"').split(',')]
            if tipo_v == 'date':
                fecha_minima = f1
            if h in OBLIGATORIOS:
                campo['required'] = True
            if h in OBLIGATORIOS_LPR:
                campo['requiredLpr'] = True
            if h.startswith('LPR:'):
                campo['when'] = 'lpr'
            if h in ('Línea de vista al punto del enlace', 'Obstáculos en la línea de vista', 'Altura de antena necesaria (m)'):
                campo['when'] = 'enlace'
            if h in AYUDAS:
                campo['hint'] = AYUDAS[h]
            if tipo == 'via-rapida' and h in FICHA_RAPIDA:
                campo['rapida'] = FICHA_RAPIDA.index(h) + 1
            hoja_campos.append(campo)
        if campos is None:
            campos = hoja_campos
            fin_pre = orden.index(LO_LEVANTA) if tipo == 'via-rapida' else i0
            precargadas = [h for h in orden[:fin_pre] if h != MAPA]
            asignacion = [h for h in orden[fin_pre:i0]] if tipo == 'via-rapida' else ['Día (plan de Iván)', LO_LEVANTA]
        elif [x['key'] for x in hoja_campos] != [x['key'] for x in campos]:
            raise SystemExit('%s: la hoja «%s» no tiene los mismos campos que la primera.' % (ruta, nombre))
        if 'Levantó' in encabezados and encabezados['Levantó'] in validaciones and validaciones[encabezados['Levantó']][0] == 'list':
            levantadores.update(o.strip() for o in validaciones[encabezados['Levantó']][1].strip('"').split(','))
        fila = FILA_INICIO
        while (encabezados[CODIGO], fila) in celdas and celdas[(encabezados[CODIGO], fila)]['v']:
            v = lambda h: celdas.get((encabezados[h], fila), {}).get('v', '') if h in encabezados else ''
            p = {'codigo': v(CODIGO), 'comuna': comuna or v('Comuna'), 'hoja': nombre, 'fila': fila,
                 'pre': {h: v(h) for h in precargadas}, 'asignacion': {h: v(h) for h in asignacion},
                 'mapa': enlaces.get('%s%d' % (encabezados[MAPA], fila), '') if MAPA in encabezados else ''}
            p['lpr'] = v('Tipo') == 'Pórtico lector de patentes'
            p['enlace'] = v(CONEXION) in REGLAS[tipo]['enlace']['valores']
            p['sinSolucion'] = p['codigo'] in SIN_SOLUCION_DEC020 if tipo == 'dec020' else False
            if tipo == 'via-rapida':
                p['clasificacion'] = nombre
                p['nodo'] = v('Nodo o central (oferta)')
                p['porUbicar'] = nombre == 'Por ubicar'
            puntos.append(p)
            fila += 1
    return {'id': id_, 'titulo': titulo, 'tipo': tipo, 'archivo': os.path.basename(ruta), 'hojas': [h for h in hojas if h in libro.hojas],
            'filaEncabezado': FILA_ENCABEZADO, 'filaInicio': FILA_INICIO, 'precargadas': precargadas, 'asignacion': asignacion,
            'campos': campos, 'reglas': REGLAS[tipo], 'fotos': FOTOS_DEC020 if tipo == 'dec020' else FOTOS_VIA_RAPIDA,
            'columnaFotos': 'Fotos (Dropbox)' if tipo == 'dec020' else None, 'puntos': puntos,
            '_fechaMinima': fecha_minima, '_levantadores': sorted(levantadores)}


def _letra(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


# Las reglas de «Control» y «Trámite resultante», con los encabezados y textos de las fórmulas de cada planilla.
REGLAS = {
    'dec020': {
        'obligatorios': OBLIGATORIOS, 'obligatoriosLpr': OBLIGATORIOS_LPR,
        'enlace': {'oferta': CONEXION, 'valores': ['Radio', 'Sin trazado en el KMZ de la oferta'], 'campo': 'Línea de vista al punto del enlace'},
        'cruce': {'campo': '¿La fibra cruzaría la ruta?', 'altura': 'Altura libre en el cruce (m)', 'minimo': 6},
        'angulos': {'montaje': 'LPR: altura de montaje de las cámaras (m)', 'captura': 'LPR: distancia de captura (m)',
                    'lateral': 'LPR: distancia lateral a la pista más lejana (m)', 'maximo': 30},
        'organismo': {'faja': 'Dentro de la faja o a menos de 20 m', 'campo': 'Organismo que autoriza (según terreno)',
                      'validos': ['Vialidad', 'Concesionaria']},
        'fotos': {'campo': FOTOS_N, 'minimo': 3},
        'tramite': None,
    },
    'via-rapida': {
        'obligatorios': OBLIGATORIOS, 'obligatoriosLpr': [],
        'enlace': {'oferta': CONEXION, 'valores': ['Radio', 'Fibra y origen de radio', 'Sin trazado en el KMZ de la oferta'],
                   'campo': 'Línea de vista al punto del enlace'},
        'cruce': {'campo': '¿La fibra cruzaría la ruta?', 'altura': 'Altura libre en el cruce (m)', 'minimo': 6},
        'angulos': None,
        'organismo': {'faja': 'Dentro de la faja o a menos de 20 m', 'campo': 'Organismo que autoriza (según terreno)',
                      'validos': ['Vialidad', 'Concesionaria']},
        'fotos': {'campo': FOTOS_N, 'minimo': 3},
        # §5.4 del prompt de vía rápida y fórmula BE de la planilla. Los 30 m y la red «a menos de 50 m» son criterios
        # de trabajo provisorios: si cambian en la planilla, se cambian aquí y se vuelve a probar la paridad.
        'tramite': {'rotura': '¿Hay rotura de pavimento?', 'redBT': 'Red BT de CGE', 'organismo': 'Organismo que autoriza (según terreno)',
                    'faja': 'Dentro de la faja o a menos de 20 m', 'distancia': 'Distancia al poste CGE (m)', 'fundacion': 'Dónde va la fundación',
                    'redOk': 'Aérea a menos de 50 m', 'distanciaMax': 30, 'areaVerde': 'Área verde',
                    'mop': ['Vialidad', 'Concesionaria'], 'serviu': 'Municipio y SERVIU'},
        'precisionGpsMax': 8,
    },
}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dec020', required=True)
    ap.add_argument('--via-rapida', action='append', default=[], metavar='COMUNA=RUTA')
    ap.add_argument('salidas', nargs='+')
    args = ap.parse_args()
    formularios = [leer_formulario(args.dec020, ['Levantamiento'], 'DEC-020', 'DEC-020 · Puntos MOP Vialidad', 'dec020')]
    for item in args.via_rapida:
        comuna, ruta = item.split('=', 1)
        formularios.append(leer_formulario(ruta, HOJAS_VIA_RAPIDA, 'VR-' + comuna, 'Municipales · ' + comuna, 'via-rapida', comuna))
    fechas = {f.pop('_fechaMinima') for f in formularios} - {None}
    levantadores = sorted(set().union(*(set(f.pop('_levantadores')) for f in formularios)))
    codigos = [p['codigo'] for f in formularios for p in f['puntos']]
    repetidos = sorted({c for c in codigos if codigos.count(c) > 1})
    if repetidos:
        raise SystemExit('Códigos repetidos entre formularios: %s' % ', '.join(repetidos))
    contrato = {'version': 2, 'fechaMinima': min(fechas) if fechas else None, 'levantadores': levantadores, 'formularios': formularios}
    for salida in args.salidas:
        with open(salida, 'w', encoding='utf-8') as f:
            json.dump(contrato, f, ensure_ascii=False, indent=1)
            f.write('\n')
    for f in formularios:
        print('%-16s %2d campos, %3d puntos (%s)' % (f['id'], len(f['campos']), len(f['puntos']), ', '.join(f['hojas'])))


if __name__ == '__main__':
    main()
