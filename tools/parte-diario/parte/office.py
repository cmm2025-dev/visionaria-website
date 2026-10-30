"""LibreOffice sin ventanas, controlado por UNO."""
import os
import shutil
import subprocess
import tempfile
import time
import uuid

import uno
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException

FILTRO_XLSX = 'Calc MS Excel 2007 XML'


def prop(nombre, valor):
    p = PropertyValue()
    p.Name, p.Value = nombre, valor
    return p


def soffice_por_defecto():
    for c in (os.environ.get('PARTE_SOFFICE') or '', '/usr/bin/soffice', '/usr/lib/libreoffice/program/soffice',
              r'C:\Program Files\LibreOffice\program\soffice.exe'):
        if c and os.path.exists(c):
            return c
    return 'soffice'


class Office:
    """Un LibreOffice propio, con su perfil temporal, para no chocar con otro que esté abierto."""

    def __init__(self, soffice=None):
        self.soffice = soffice or soffice_por_defecto()

    def __enter__(self):
        self.perfil = tempfile.mkdtemp(prefix='parte_lo_')
        tubo = 'parte_diario_' + uuid.uuid4().hex[:8]
        self.proceso = subprocess.Popen([
            self.soffice, '-env:UserInstallation=' + uno.systemPathToFileUrl(self.perfil),
            '--headless', '--invisible', '--nologo', '--norestore', '--nodefault', '--nolockcheck',
            '--accept=pipe,name=%s;urp;StarOffice.ComponentContext' % tubo,
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        for _ in range(120):
            try:
                ctx = resolver.resolve('uno:pipe,name=%s;urp;StarOffice.ComponentContext' % tubo)
                break
            except NoConnectException:
                if self.proceso.poll() is not None:
                    raise RuntimeError('LibreOffice se cerró al iniciar.')
                time.sleep(0.5)
        else:
            raise RuntimeError('LibreOffice no respondió en 60 segundos.')
        self.desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
        return self

    def abrir(self, ruta):
        doc = self.desktop.loadComponentFromURL(uno.systemPathToFileUrl(os.path.abspath(ruta)), '_blank', 0, (
            prop('Hidden', True), prop('MacroExecutionMode', 0), prop('UpdateDocMode', 0),
        ))
        if doc is None:
            raise RuntimeError('LibreOffice no pudo abrir %s' % ruta)
        return doc

    @staticmethod
    def guardar_xlsx(doc, ruta):
        doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(ruta)), (prop('FilterName', FILTRO_XLSX),))

    def __exit__(self, *_):
        try:
            self.desktop.terminate()
        except Exception:
            pass
        try:
            self.proceso.wait(timeout=30)
        except subprocess.TimeoutExpired:
            self.proceso.kill()
        shutil.rmtree(self.perfil, ignore_errors=True)
