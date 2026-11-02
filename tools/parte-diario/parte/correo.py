"""Correos del contrato (directriz DIR-P07): el único lugar donde se arma un asunto y se envía un correo.

Todo correo del contrato lleva el asunto [licitación][proyecto][TIPO][TEMA]. El prefijo sale de proyecto.json, no del
código, para que otro proyecto de Operaciones use su propio ID y nombre. Cada envío, enviado o no, queda en la tabla
«correos»: nada se borra.

La app solo escribe al equipo: un correo CL o EXT, o con un destinatario fuera de los dominios internos, no se envía
y queda registrado como rechazado. Sin PARTE_RESEND_API_KEY o sin destinatarios para el rol, no se envía nada y el
servicio sigue igual (queda registrado como «sin_configurar»)."""
import functools
import hashlib
import json
import logging
import os
import re
import unicodedata
import urllib.error
import urllib.request

log = logging.getLogger('parte.correo')
TIPOS = ('INT', 'CL', 'EXT')
# Lo que no puede ir en un correo de la app: montos, RUT y teléfonos. Nombre, rol y comuna sí.
PROHIBIDO = [(re.compile(r'\$\s?\d|\b(?:CLP|UF)\s?\d', re.I), 'montos'),
             (re.compile(r'\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b'), 'RUT'),
             (re.compile(r'(?:\+?56\s?)?9\s?\d{4}\s?\d{4}\b'), 'teléfonos')]


@functools.lru_cache(maxsize=1)
def proyecto():
    """La configuración del proyecto (proyecto.json). None si no existe: los correos quedan desactivados."""
    ruta = os.environ.get('PARTE_PROYECTO') or '/etc/parte-diario/proyecto.json'
    if not os.path.isfile(ruta):
        return None
    with open(ruta, encoding='utf-8') as f:
        p = json.load(f)
    for campo in ('licitacion', 'nombre'):
        if not str(p.get(campo) or '').strip():
            raise ValueError('proyecto.json: falta «%s».' % campo)
    return p


def _requiere_proyecto():
    p = proyecto()
    if p is None:
        raise ValueError('Falta proyecto.json: sin él no se puede armar el asunto de un correo del contrato.')
    return p


def tema_normalizado(tema):
    """Mayúsculas, sin tildes ni corchetes, un solo espacio entre palabras (como «INTEGRACION HANWHA»)."""
    sin_tildes = ''.join(c for c in unicodedata.normalize('NFD', str(tema or '')) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', sin_tildes.replace('[', ' ').replace(']', ' ')).strip().upper()


def asunto(tipo, tema):
    """[licitación][proyecto][TIPO][TEMA]. Si no cabe en el máximo, se recorta el tema; el prefijo, nunca."""
    if tipo not in TIPOS:
        raise ValueError('Tipo de correo «%s» no válido: debe ser INT, CL o EXT.' % tipo)
    p = _requiere_proyecto()
    maximo = int(p.get('asunto_max') or 120)
    prefijo = '[%s][%s][%s]' % (p['licitacion'], p['nombre'], tipo)
    t = tema_normalizado(tema)
    if not t:
        raise ValueError('El tema del correo no puede quedar vacío.')
    cabe = maximo - len(prefijo) - 2
    if cabe < 10:
        raise ValueError('proyecto.json: el prefijo «%s» no deja espacio para el tema con asunto_max=%d.' % (prefijo, maximo))
    if len(t) > cabe:
        t = t[:cabe].rstrip()
    return '%s[%s]' % (prefijo, t)


def destinatarios(rol):
    """Los correos configurados para un rol (Administrador de Contrato, Directores, …) en proyecto.json."""
    p = proyecto() or {}
    return list((p.get('destinatarios') or {}).get(rol) or [])


def motivo_rechazo(tipo, para, cuerpo):
    """Por qué la app no puede enviar este correo, o None."""
    p = _requiere_proyecto()
    if tipo != 'INT':
        return 'La app solo envía correos internos (INT); un correo %s lo revisa y lo envía una persona.' % tipo
    dominios = [d.lower() for d in (p.get('dominios_internos') or [])]
    fuera = [x for x in para if not dominios or x.rsplit('@', 1)[-1].lower() not in dominios]
    if fuera:
        return 'Destinatarios fuera de los dominios internos: %s.' % ', '.join(fuera)
    for patron, que in PROHIBIDO:
        if patron.search(cuerpo):
            return 'El cuerpo trae %s, y los correos de la app no llevan montos ni datos personales.' % que
    return None


def _message_id(evento):
    dominio = (_requiere_proyecto().get('correo') or {}).get('remitente', 'visionaria.cl').rsplit('@', 1)[-1]
    return '<%s@%s>' % (hashlib.sha256(evento.encode('utf-8')).hexdigest()[:32], dominio)


def registrar(conn, evento, tipo, tema, asunto_final, para, estado, detalle=None, proveedor_id=None):
    conn.execute('''INSERT INTO correos (en_chile, evento, tipo, tema, asunto, para, estado, detalle, proveedor_id)
                    VALUES (to_char(clock_timestamp() AT TIME ZONE 'America/Santiago', 'DD-MM-YYYY HH24:MI:SS'),
                            %s,%s,%s,%s,%s,%s,%s,%s)''',
                 (evento, tipo, tema, asunto_final, list(para), estado, detalle, proveedor_id))
    conn.commit()


def _post_resend(cuerpo_json, clave):
    req = urllib.request.Request('https://api.resend.com/emails', data=json.dumps(cuerpo_json).encode('utf-8'), method='POST',
                                 headers={'Authorization': 'Bearer ' + clave, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read() or b'{}')


def enviar(conn, tipo, tema, para, texto, evento, envio=_post_resend):
    """Arma el asunto, revisa el correo, lo envía y lo registra. Devuelve el estado: enviado, rechazado, sin_configurar o error.

    evento: clave estable del hecho (por ejemplo «falla-planilla:Tocopilla»). Los avisos del mismo hecho conservan el
    asunto y el hilo (Message-ID del primero, In-Reply-To/References en los siguientes)."""
    asunto_final = asunto(tipo, tema)
    para = [x.strip() for x in para if x and x.strip()]
    clave = os.environ.get('PARTE_RESEND_API_KEY') or ''
    remitente = (_requiere_proyecto().get('correo') or {}).get('remitente') or ''
    if not para or not clave or not remitente:
        falta = 'destinatarios' if not para else 'PARTE_RESEND_API_KEY' if not clave else 'remitente en proyecto.json'
        registrar(conn, evento, tipo, tema, asunto_final, para, 'sin_configurar', 'Falta ' + falta + '.')
        return 'sin_configurar'
    motivo = motivo_rechazo(tipo, para, texto)
    if motivo:
        registrar(conn, evento, tipo, tema, asunto_final, para, 'rechazado', motivo)
        log.warning('Correo rechazado (%s): %s', asunto_final, motivo)
        return 'rechazado'
    raiz = _message_id(evento)
    previo = conn.execute("SELECT 1 FROM correos WHERE evento=%s AND estado='enviado' LIMIT 1", (evento,)).fetchone()
    cabeceras = {'In-Reply-To': raiz, 'References': raiz} if previo else {'Message-ID': raiz}
    try:
        r = envio({'from': remitente, 'to': para, 'subject': asunto_final, 'text': texto, 'headers': cabeceras}, clave)
    except (urllib.error.URLError, OSError, ValueError) as e:
        detalle = e.read().decode('utf-8', 'replace')[:300] if isinstance(e, urllib.error.HTTPError) else str(e)
        registrar(conn, evento, tipo, tema, asunto_final, para, 'error', detalle)
        log.error('No se pudo enviar el correo «%s»: %s', asunto_final, detalle)
        return 'error'
    registrar(conn, evento, tipo, tema, asunto_final, para, 'enviado', None, (r or {}).get('id'))
    log.info('Correo enviado: %s → %s', asunto_final, ', '.join(para))
    return 'enviado'


def avisar_falla(conn, que, texto):
    """Correo 7 del inventario: una falla de sincronización o de escritura en una planilla, al rol «fallas»."""
    if proyecto() is None:
        return None
    try:
        return enviar(conn, 'INT', 'FALLA ' + que, destinatarios('fallas'),
                      texto + '\n\nAviso automático del servicio del parte diario. El detalle queda también en la carpeta AVISOS de la cola.',
                      'falla:' + tema_normalizado(que))
    except Exception:
        conn.rollback()
        log.exception('No se pudo procesar el correo de la falla.')
        return 'error'
