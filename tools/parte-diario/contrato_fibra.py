#!/usr/bin/env python3
"""Genera el contrato de datos del módulo de fibra óptica desde las planillas «Tendido FO» (una por comuna).

Cada planilla tiene las hojas Ruta y Apoyos (levantamiento previo) y Tendido, Mufas, Reservas y Derivaciones (calidad
de ejecución). Quién llena cada columna lo dice su color en la primera fila de datos:

    gris (EDEDED)     precargada, solo lectura
    blanco (FFFFFF)   asignación («Lo levanta», «Día») o ingeniería (solo roles de oficina)
    amarillo (FFF2CC) levantamiento o ejecución
    verde (E2EFDA)    inspección
    azul (DDEBF7)     calculada: la planilla la calcula con una fórmula y nadie la escribe

Las columnas se leen por el nombre del encabezado (fila 4); las listas y tipos, de las validaciones (expandiendo sus
rangos); los umbrales, de la hoja «Parámetros» por el nombre del parámetro. Además se comprueba que cada fórmula de la
planilla lea del parámetro que las reglas de la app esperan: si alguien mueve una fila de «Parámetros», el script se
detiene en vez de producir un contrato que calcule otra cosa. Solo usa la biblioteca estándar:

    python3 tools/parte-diario/contrato_fibra.py --trazado <DPR-02-GIS-001_….geojson> \\
        Antofagasta=<…_Antofagasta.xlsx> Calama=<…> Tocopilla=<…> <carpeta de salida>

Deja <carpeta>/fibra_<Comuna>.json, uno por comuna. El trazado (la capa GeoJSON del catastro, en la Sala) aporta la
línea de cada tramo para el mapa de la app, que funciona sin señal; cada tramo de «Ruta» debe estar en la capa."""
import html
import json
import os
import re
import sys

from contrato_levantamiento import Libro, col_num, _letra

FILA_ENCABEZADO, FILA_INICIO = 4, 5
HOJAS = ['Ruta', 'Apoyos', 'Tendido', 'Mufas', 'Reservas', 'Derivaciones']
PREFIJO = {'Antofagasta': 'AN', 'Calama': 'CA', 'Tocopilla': 'TO'}
ROL_POR_COLOR = {'EDEDED': 'gris', 'FFFFFF': 'blanco', 'FFF2CC': 'amarillo', 'E2EFDA': 'verde', 'DDEBF7': 'calculada'}
ASIGNACION = ['Lo levanta', 'Día']
TIPOS = {'list': 'list', 'date': 'date', 'decimal': 'decimal', 'whole': 'whole'}

# Parámetros que usan las reglas, con la celda que deben leer las fórmulas (columna: fórmula, celda de Parámetros).
PARAMETROS = {
    'calles': 'Altura libre mínima sobre calles y pasajes (m)',
    'avenidas': 'Altura libre mínima sobre avenidas, rutas y carreteras (m)',
    'fotosApoyo': 'Fotos mínimas por apoyo',
    'fotosRuta': 'Fotos mínimas por tramo (levantamiento de ruta)',
    'fotosTendido': 'Fotos mínimas de ejecución por tramo',
    'fotosMufa': 'Fotos mínimas de ejecución por mufa',
    'fotosReserva': 'Fotos mínimas de ejecución por reserva',
    'fotosDerivacion': 'Fotos mínimas de ejecución por derivación',
    'fotosInspeccion': 'Fotos mínimas por inspección',
    'fusionMax': 'Pérdida máxima por fusión (dB)',
    'cocaMin': 'Diámetro mínimo de la coca de reserva (cm)',
    'pelosOscuros': 'Pelos de fibra oscura de reserva por punto',
}
# Qué parámetros debe leer la fórmula de cada columna calculada (la comprobación de arriba).
FORMULAS = {
    ('Ruta', 'Control'): ['fotosRuta'],
    ('Apoyos', 'Control'): ['fotosApoyo', 'calles', 'avenidas'],
    ('Tendido', 'Estado de calidad'): ['fotosTendido', 'fotosInspeccion', 'calles', 'avenidas'],
    ('Mufas', 'Estado de calidad'): ['fotosMufa', 'fotosInspeccion', 'fusionMax'],
    ('Reservas', 'Estado de calidad'): ['fotosReserva', 'fotosInspeccion', 'cocaMin'],
    ('Derivaciones', 'Estado de calidad'): ['fotosDerivacion', 'fotosInspeccion', 'pelosOscuros'],
}


class LibroFO(Libro):
    """Agrega a la lectura del xlsx el color de relleno de cada celda, el tipo del valor y las validaciones por rango."""

    def __init__(self, ruta):
        super().__init__(ruta)
        st = self.z.read('xl/styles.xml').decode()
        fills = []
        for f in re.findall(r'<fill>(.*?)</fill>', re.search(r'<fills[^>]*>(.*?)</fills>', st, re.S).group(1), re.S):
            m = re.search(r'<fgColor rgb="([0-9A-Fa-f]{8})"', f)
            fills.append(m.group(1)[-6:].upper() if m and 'patternType="solid"' in f else None)
        xfs = re.search(r'<cellXfs[^>]*>(.*?)</cellXfs>', st, re.S).group(1)
        self.relleno = [fills[int(m)] if int(m) < len(fills) else None
                        for m in re.findall(r'<xf [^>]*?fillId="(\d+)"', xfs)]

    def hoja_fo(self, nombre):
        x = self.z.read(self.hojas[nombre]).decode()
        celdas = {}
        for c in re.finditer(r'<c r="([A-Z]+)(\d+)"([^>]*?)(?:/>|>(.*?)</c>)', x, re.S):
            attrs, cuerpo = c.group(3), c.group(4) or ''
            v = re.search(r'<v>(.*?)</v>', cuerpo, re.S)
            t = re.search(r'<is>.*?<t[^>]*>(.*?)</t>', cuerpo, re.S)
            s = re.search(r'\bs="(\d+)"', attrs)
            texto = 't="s"' in attrs or 't="str"' in attrs or 't="inlineStr"' in attrs
            if v:
                valor = self.ss[int(v.group(1))] if 't="s"' in attrs else html.unescape(v.group(1))
                if not texto:
                    try:
                        n = float(valor)
                        valor = int(n) if n == int(n) else n
                    except ValueError:
                        pass
            else:
                valor = html.unescape(t.group(1)) if t else ''
            celdas[(c.group(1), int(c.group(2)))] = {'v': valor, 'f': re.search(r'<f[ >]', cuerpo) and re.search(r'<f[^>]*>(.*?)</f>', cuerpo, re.S),
                                                     'color': self.relleno[int(s.group(1))] if s and int(s.group(1)) < len(self.relleno) else None}
        validaciones = {}
        for dv in re.findall(r'<dataValidation\b(.*?)</dataValidation>', x, re.S):
            attrs = dict(re.findall(r'(\w+)="([^"]*)"', dv.split('>')[0]))
            f1 = re.search(r'<formula1>(.*?)</formula1>', dv, re.S)
            for rango in attrs['sqref'].split():
                a, _, b = rango.partition(':')
                ca, cb = re.match(r'[A-Z]+', a).group(0), re.match(r'[A-Z]+', b or a).group(0)
                for n in range(col_num(ca), col_num(cb) + 1):
                    validaciones.setdefault(_letra(n), (attrs.get('type'), html.unescape(f1.group(1)) if f1 else ''))
        return celdas, validaciones


def formula_texto(celda):
    return html.unescape(celda['f'].group(1)) if celda and celda.get('f') else ''


def leer_parametros(libro):
    celdas, _ = libro.hoja_fo('Parámetros')
    out, filas = {}, {}
    fila = FILA_ENCABEZADO + 1
    while (('A', fila) in celdas) and celdas[('A', fila)]['v']:
        nombre = str(celdas[('A', fila)]['v'])
        out[nombre] = {'valor': celdas.get(('B', fila), {}).get('v', ''), 'fuente': celdas.get(('C', fila), {}).get('v', ''),
                       'estado': celdas.get(('D', fila), {}).get('v', '')}
        filas[fila] = nombre
        fila += 1
    return out, filas


def leer_fotos(libro):
    """Hoja «Fotos»: por elemento, su sufijo y la lista de tomas (las primeras obligatorias; el mínimo está en Parámetros)."""
    celdas, _ = libro.hoja_fo('Fotos')
    out, fila = [], FILA_ENCABEZADO + 1
    while ('A', fila) in celdas and celdas[('A', fila)]['v'] and ('B', fila) in celdas:
        tomas = [t.strip().rstrip(';.') for t in re.split(r'\s*\d+\)\s*', str(celdas.get(('C', fila), {}).get('v', ''))) if t.strip()]
        out.append({'elemento': celdas[('A', fila)]['v'], 'sufijo': celdas[('B', fila)]['v'], 'tomas': tomas})
        fila += 1
    return out


def leer_hoja(libro, nombre, parametros_por_fila):
    celdas, validaciones = libro.hoja_fo(nombre)
    encabezados, c = {}, 1
    while (letra := _letra(c)) and ((letra, FILA_ENCABEZADO) in celdas or c < 3):
        if (letra, FILA_ENCABEZADO) in celdas and celdas[(letra, FILA_ENCABEZADO)]['v']:
            encabezados[str(celdas[(letra, FILA_ENCABEZADO)]['v'])] = letra
        c += 1
    orden = sorted(encabezados, key=lambda h: col_num(encabezados[h]))
    campos = []
    for h in orden:
        letra = encabezados[h]
        primera = celdas.get((letra, FILA_INICIO), {})
        rol = 'calculada' if primera.get('f') else ROL_POR_COLOR.get(primera.get('color') or 'FFFFFF', 'blanco')
        if rol == 'blanco':
            rol = 'asignacion' if h in ASIGNACION else 'ingenieria'
        tipo_v, f1 = validaciones.get(letra, (None, ''))
        campo = {'key': h, 'col': letra, 'rol': rol, 'type': TIPOS.get(tipo_v, 'text')}
        if tipo_v == 'list':
            campo['options'] = [o.strip() for o in f1.strip('"').split(',')]
        if rol == 'calculada':
            campo['formula'] = formula_texto(primera)
        campos.append(campo)
    # La fórmula de cada columna calculada debe leer exactamente los parámetros que la regla de la app espera.
    for campo in campos:
        esperados = FORMULAS.get((nombre, campo['key']))
        if esperados is None:
            continue
        leidos = {parametros_por_fila.get(int(n)) for n in re.findall(r'Parámetros!\$B\$(\d+)', campo['formula'])}
        if leidos != {PARAMETROS[k] for k in esperados}:
            raise SystemExit('%s · %s «%s»: la fórmula lee %s y la regla espera %s.' % (
                libro_nombre(libro), nombre, campo['key'], sorted(x for x in leidos if x), sorted(PARAMETROS[k] for k in esperados)))
    fijas = [c['key'] for c in campos if c['rol'] in ('gris', 'asignacion', 'ingenieria')]
    filas, fila = [], FILA_INICIO
    letra_codigo = campos[0]['col']
    while (letra_codigo, fila) in celdas and celdas[(letra_codigo, fila)]['v'] != '':
        filas.append([fila] + [celdas.get((encabezados[h], fila), {}).get('v', '') for h in fijas])
        fila += 1
    return {'codigo': campos[0]['key'], 'campos': [{k: v for k, v in c.items() if k != 'formula'} for c in campos],
            'fijas': fijas, 'filas': filas}


def libro_nombre(libro):
    return os.path.basename(libro.z.filename)


def trazados(geojson):
    """{id de tramo: [[lat, lon], …]} de las líneas de fibra (FO12 y FO24) de la capa; las de radio no son tramos."""
    with open(geojson, encoding='utf-8') as fh:
        capa = json.load(fh)
    return {f['properties']['id']: [[round(lat, 6), round(lon, 6)] for lon, lat, *_ in f['geometry']['coordinates']]
            for f in capa['features'] if f['geometry']['type'] == 'LineString' and f['properties'].get('tipo') in ('FO12', 'FO24')}


def leer_comuna(comuna, ruta, lineas):
    libro = LibroFO(ruta)
    faltan = [h for h in HOJAS + ['Parámetros', 'Fotos'] if h not in libro.hojas]
    if faltan:
        raise SystemExit('%s: faltan las hojas %s.' % (ruta, ', '.join(faltan)))
    parametros, por_fila = leer_parametros(libro)
    falta = [v for v in PARAMETROS.values() if v not in parametros]
    if falta:
        raise SystemExit('%s: faltan los parámetros %s.' % (ruta, '; '.join(falta)))
    hojas = {h: leer_hoja(libro, h, por_fila) for h in HOJAS}
    ruta_h = hojas['Ruta']
    ids = [f[ruta_h['fijas'].index(ruta_h['codigo']) + 1] for f in ruta_h['filas']]
    sin = [i for i in ids if i not in lineas]
    if sin:
        raise SystemExit('%s: %d tramo(s) sin línea en el trazado: %s.' % (ruta, len(sin), ', '.join(sin[:10])))
    return {'version': 1, 'comuna': comuna, 'prefijo': PREFIJO[comuna], 'archivo': os.path.basename(ruta),
            'filaEncabezado': FILA_ENCABEZADO, 'filaInicio': FILA_INICIO,
            'parametros': parametros, 'claves': PARAMETROS, 'fotos': leer_fotos(libro),
            'trazado': {i: lineas[i] for i in ids}, 'hojas': hojas}


def main():
    args = sys.argv[1:]
    if len(args) < 4 or args[0] != '--trazado':
        raise SystemExit(__doc__)
    lineas = trazados(args[1])
    *pares, salida = args[2:]
    os.makedirs(salida, exist_ok=True)
    for par in pares:
        comuna, ruta = par.split('=', 1)
        c = leer_comuna(comuna, ruta, lineas)
        destino = os.path.join(salida, 'fibra_%s.json' % comuna)
        with open(destino, 'w', encoding='utf-8') as fh:
            json.dump(c, fh, ensure_ascii=False, separators=(',', ':'))
        cuenta = ', '.join('%s %d' % (h, len(c['hojas'][h]['filas'])) for h in HOJAS)
        print('%s: %s · %d KB' % (comuna, cuenta, os.path.getsize(destino) // 1024))


if __name__ == '__main__':
    main()
