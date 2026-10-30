"""Cliente mínimo de Dropbox (API v2) con la app de la empresa. Solo conexiones salientes."""
import json
import os
import urllib.error
import urllib.parse
import urllib.request


class DropboxError(Exception):
    def __init__(self, estado, cuerpo):
        super().__init__('Dropbox respondió %s: %s' % (estado, cuerpo[:300]))
        self.estado, self.cuerpo = estado, cuerpo

    def es(self, texto):
        return self.estado == 409 and texto in self.cuerpo


class Dropbox:
    def __init__(self, key=None, secret=None, refresh=None):
        self.key = key or os.environ.get('DROPBOX_APP_KEY')
        self.secret = secret or os.environ.get('DROPBOX_APP_SECRET')
        self.refresh = refresh or os.environ.get('DROPBOX_REFRESH_TOKEN')
        if not (self.key and self.secret and self.refresh):
            raise RuntimeError('Faltan DROPBOX_APP_KEY, DROPBOX_APP_SECRET o DROPBOX_REFRESH_TOKEN.')
        self.token = None
        self.raiz = None

    def _pedir(self, url, datos, cabeceras):
        req = urllib.request.Request(url, data=datos, headers=cabeceras, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                return resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            raise DropboxError(e.code, e.read().decode('utf-8', 'replace'))

    def _token(self):
        if not self.token:
            datos = urllib.parse.urlencode({'grant_type': 'refresh_token', 'refresh_token': self.refresh,
                                            'client_id': self.key, 'client_secret': self.secret}).encode()
            cuerpo, _ = self._pedir('https://api.dropboxapi.com/oauth2/token', datos,
                                    {'Content-Type': 'application/x-www-form-urlencoded'})
            self.token = json.loads(cuerpo)['access_token']
            cuenta, _ = self._pedir('https://api.dropboxapi.com/2/users/get_current_account', None,
                                    {'Authorization': 'Bearer ' + self.token})
            self.raiz = json.loads(cuenta)['root_info']['root_namespace_id']
        return self.token

    def _cabeceras(self, extra):
        c = {'Authorization': 'Bearer ' + self._token(),
             'Dropbox-API-Path-Root': json.dumps({'.tag': 'root', 'root': self.raiz})}
        c.update(extra)
        return c

    def _con_reintento(self, fn):
        try:
            return fn()
        except DropboxError as e:
            if e.estado != 401:
                raise
            self.token = None  # el token de acceso caducó: se pide otro y se repite una vez
            return fn()

    def rpc(self, ruta, cuerpo):
        def ir():
            datos, _ = self._pedir('https://api.dropboxapi.com/2/' + ruta, json.dumps(cuerpo).encode(),
                                   self._cabeceras({'Content-Type': 'application/json'}))
            return json.loads(datos) if datos else {}
        return self._con_reintento(ir)

    def metadata(self, ruta):
        return self.rpc('files/get_metadata', {'path': ruta})

    def descargar(self, ruta):
        def ir():
            datos, cab = self._pedir('https://content.dropboxapi.com/2/files/download', b'',
                                     self._cabeceras({'Dropbox-API-Arg': json.dumps({'path': ruta}),
                                                      'Content-Type': 'text/plain'}))
            meta = {k.lower(): v for k, v in cab.items()}['dropbox-api-result']
            return datos, json.loads(meta)
        return self._con_reintento(ir)

    def subir(self, ruta, datos, modo='add', sobrescribir=False):
        """modo: 'add' (falla si existe), 'overwrite', o {'.tag':'update','update':rev} (falla si cambió)."""
        arg = {'path': ruta, 'mode': modo, 'autorename': False, 'mute': True, 'strict_conflict': not sobrescribir}

        def ir():
            cuerpo, _ = self._pedir('https://content.dropboxapi.com/2/files/upload', datos,
                                    self._cabeceras({'Dropbox-API-Arg': json.dumps(arg),
                                                     'Content-Type': 'application/octet-stream'}))
            return json.loads(cuerpo)
        return self._con_reintento(ir)

    def listar(self, carpeta):
        r = self.rpc('files/list_folder', {'path': carpeta, 'recursive': False})
        entradas = r['entries']
        while r.get('has_more'):
            r = self.rpc('files/list_folder/continue', {'cursor': r['cursor']})
            entradas += r['entries']
        return entradas

    def mover(self, origen, destino):
        return self.rpc('files/move_v2', {'from_path': origen, 'to_path': destino, 'autorename': True})
