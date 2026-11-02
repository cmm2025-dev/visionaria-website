"""Criterios de aceptación de la DIR-P07 (asunto de los correos). Corre sin base de datos ni Resend:

    docker compose run --rm -v "$PWD/tests:/app/tests:ro" -v "$PWD/proyecto.ejemplo.json:/app/proyecto.ejemplo.json:ro" \\
        parte python3 -m unittest discover -s /app/tests -v
"""
import glob
import json
import os
import tempfile
import unittest

from parte import correo

AQUI = os.path.dirname(os.path.abspath(__file__))
EJEMPLO = os.path.join(AQUI, '..', 'proyecto.ejemplo.json')
CODIGO = os.path.join(AQUI, '..', 'parte')
# El inventario de la directriz: un correo de cada clase, con su tema y su evento.
INVENTARIO = [
    ('ALERTA CRITICA BLOQUEO ANT-004', 'alerta:r1'),
    ('PENDIENTES CALAMA 03-11-2026', 'pendientes:Calama:2026-11-03'),
    ('TAREA T-12 REVISAR POSTE ANT-004', 'tarea:T-12'),
    ('CIERRE LEVANTAMIENTO ANTOFAGASTA 10-11-2026', 'cierre-lev:Antofagasta:2026-11-10'),
    ('LOTE VIA RAPIDA ANT NODO 7 PARA APROBACION', 'lote:ANT-7'),
    ('PROPUESTA RG-001 DEC-020', 'rg001:DEC-020'),
    ('FALLA PLANILLA TOCOPILLA', 'falla:PLANILLA TOCOPILLA'),
]


class Conexion:
    """Lo justo de psycopg para correo.py: guarda los INSERT en «correos» y responde la consulta del hilo."""
    def __init__(self):
        self.correos = []

    def execute(self, sql, params=()):
        conexion = self

        class Resultado:
            def fetchone(self):
                if 'FROM correos WHERE evento' in sql:
                    return next(({'?': 1} for c in conexion.correos if c['evento'] == params[0] and c['estado'] == 'enviado'), None)
                return None
        if sql.lstrip().startswith('INSERT INTO correos'):
            claves = ('evento', 'tipo', 'tema', 'asunto', 'para', 'estado', 'detalle', 'proveedor_id')
            self.correos.append(dict(zip(claves, params)))
        return Resultado()

    def commit(self):
        pass

    def rollback(self):
        pass


def con_proyecto(datos):
    f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
    json.dump(datos, f)
    f.close()
    os.environ['PARTE_PROYECTO'] = f.name
    correo.proyecto.cache_clear()
    return f.name


class Asunto(unittest.TestCase):
    def setUp(self):
        with open(EJEMPLO, encoding='utf-8') as f:
            self.base = json.load(f)
        self.base['destinatarios'] = {'fallas': ['ivan@visionaria.cl']}
        self.ruta = con_proyecto(self.base)
        os.environ['PARTE_RESEND_API_KEY'] = 'prueba'
        self.enviados = []

    def tearDown(self):
        os.unlink(self.ruta)
        os.environ.pop('PARTE_RESEND_API_KEY', None)
        correo.proyecto.cache_clear()

    def falso_resend(self, cuerpo, clave):
        self.enviados.append(cuerpo)
        return {'id': 'id-%d' % len(self.enviados)}

    def test_prefijo_y_tipo_en_todo_el_inventario(self):
        for tema, _ in INVENTARIO:
            a = correo.asunto('INT', tema)
            self.assertTrue(a.startswith('[1604-4-LR25][DPR Antofagasta][INT]['), a)
            self.assertTrue(a.endswith(']'))
        self.assertEqual(correo.asunto('EXT', 'Factibilidad CGE ANT-004'), '[1604-4-LR25][DPR Antofagasta][EXT][FACTIBILIDAD CGE ANT-004]')
        self.assertEqual(correo.asunto('CL', 'Acta de inicio'), '[1604-4-LR25][DPR Antofagasta][CL][ACTA DE INICIO]')

    def test_tipo_obligatorio_y_sin_valor_por_defecto(self):
        for malo in (None, '', 'int', 'OTRO'):
            with self.assertRaises(ValueError):
                correo.asunto(malo, 'TEMA')

    def test_tema_en_mayusculas_sin_tildes_ni_corchetes(self):
        self.assertEqual(correo.asunto('INT', '  integración  [hanwha] cámara Ñuble '),
                         '[1604-4-LR25][DPR Antofagasta][INT][INTEGRACION HANWHA CAMARA NUBLE]')

    def test_el_prefijo_sale_de_la_configuracion(self):
        con_proyecto({**self.base, 'licitacion': '2673-48-LR24', 'nombre': 'Melipilla'})
        for tema, _ in INVENTARIO:
            self.assertTrue(correo.asunto('INT', tema).startswith('[2673-48-LR24][Melipilla][INT]['))

    def test_largo_maximo_sin_cortar_el_prefijo(self):
        a = correo.asunto('INT', 'TEMA MUY LARGO ' * 20)
        self.assertLessEqual(len(a), 120)
        self.assertTrue(a.startswith('[1604-4-LR25][DPR Antofagasta][INT]['))
        self.assertTrue(a.endswith(']'))
        con_proyecto({**self.base, 'asunto_max': 40})
        with self.assertRaises(ValueError):
            correo.asunto('INT', 'TEMA')

    def test_mismo_hecho_mismo_asunto_y_mismo_hilo(self):
        conn = Conexion()
        for _ in range(2):
            correo.enviar(conn, 'INT', 'Alerta crítica bloqueo ANT-004', ['ivan@visionaria.cl'], 'Bloqueo en ANT-004.', 'alerta:r1', self.falso_resend)
        primero, segundo = self.enviados
        self.assertEqual(primero['subject'], segundo['subject'])
        self.assertEqual(primero['headers']['Message-ID'], segundo['headers']['In-Reply-To'])

    def test_registro_con_el_asunto_final(self):
        conn = Conexion()
        estado = correo.enviar(conn, 'INT', 'Falla planilla Tocopilla', ['ivan@visionaria.cl'], 'La planilla está abierta.',
                               'falla:PLANILLA TOCOPILLA', self.falso_resend)
        self.assertEqual(estado, 'enviado')
        r = conn.correos[-1]
        self.assertEqual(r['asunto'], '[1604-4-LR25][DPR Antofagasta][INT][FALLA PLANILLA TOCOPILLA]')
        self.assertEqual(r['para'], ['ivan@visionaria.cl'])
        self.assertEqual(r['proveedor_id'], 'id-1')

    def test_no_escribe_a_terceros_ni_lleva_montos_o_rut(self):
        conn = Conexion()
        casos = [('EXT', ['ivan@visionaria.cl'], 'Texto'), ('INT', ['alguien@cge.cl'], 'Texto'),
                 ('INT', ['ivan@visionaria.cl'], 'Costo $ 1.200.000'), ('INT', ['ivan@visionaria.cl'], 'RUT 12.345.678-9')]
        for tipo, para, texto in casos:
            self.assertEqual(correo.enviar(conn, tipo, 'TEMA', para, texto, 'x', self.falso_resend), 'rechazado')
        self.assertEqual(self.enviados, [])
        self.assertTrue(all(c['estado'] == 'rechazado' and c['asunto'].startswith('[1604-4-LR25]') for c in conn.correos))

    def test_sin_clave_no_envia_y_queda_registrado(self):
        os.environ.pop('PARTE_RESEND_API_KEY')
        conn = Conexion()
        self.assertEqual(correo.enviar(conn, 'INT', 'TEMA', ['ivan@visionaria.cl'], 'Texto', 'x', self.falso_resend), 'sin_configurar')
        self.assertEqual(self.enviados, [])
        self.assertEqual(conn.correos[-1]['estado'], 'sin_configurar')


class UnaSolaFuente(unittest.TestCase):
    """Ningún correo arma su asunto ni llama a Resend fuera de correo.py, y el prefijo no está escrito en el código."""

    def test_solo_correo_py_envia_y_arma_asuntos(self):
        with open(EJEMPLO, encoding='utf-8') as f:
            licitacion = json.load(f)['licitacion']
        for ruta in glob.glob(os.path.join(CODIGO, '*.py')):
            if os.path.basename(ruta) == 'correo.py':
                continue
            with open(ruta, encoding='utf-8') as f:
                texto = f.read()
            nombre = os.path.basename(ruta)
            self.assertNotIn('api.resend.com', texto, '%s envía correos sin pasar por correo.py' % nombre)
            self.assertNotIn("'subject'", texto, '%s arma un asunto sin pasar por correo.py' % nombre)
            self.assertNotIn(licitacion, texto, '%s tiene el prefijo escrito en el código' % nombre)


if __name__ == '__main__':
    unittest.main()
