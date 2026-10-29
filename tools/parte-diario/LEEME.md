# Parte diario desde la app Evidencias

La app Evidencias de terreno deja un registro (JSON) en una carpeta de cola de Dropbox por cada
evidencia recibida. `escribir_parte.py` corre en el PC de la oficina y convierte cada registro en una
fila del «Parte diario» de la planilla de terreno de su comuna.

## Qué escribe

Solo las columnas de ingreso (blancas), en la primera fila libre:

| Columna | Valor |
|---|---|
| B Fecha | Fecha del hecho (fecha real, no texto) |
| C Punto | Código del punto, o GENERAL |
| D Hecho | Texto exacto de la lista de la planilla |
| E Ejecutó | Lo que eligió el técnico (obligatorio en etapas) |
| F Detalle | Observación · GPS lat, lon ±m · a N m del punto KMZ · registró usuario · ref xxxxxxxx |
| G Foto | Sí |

A (ID), I (Nombre de la foto), J (Control) y K (Tipo) las calcula la planilla. La foto ya está en
`<Comuna>/Fotos` con el nombre que muestra la columna I.

## Cuándo no escribe

- **La planilla cambió hace menos de `minutos_de_reposo`, o está abierta** (archivo `~$…` o `.~lock…`):
  espera a la próxima pasada y deja la cola intacta.
- **La planilla cambió en Dropbox durante la pasada:** la subida va condicionada a la revisión
  descargada, así que no se sube nada y se reintenta luego. Nunca se crea una copia en conflicto.
- **Lo que la validación de la planilla no dejaría escribir a una persona** (punto, hecho o «Ejecutó»
  fuera de lista, fecha anterior al inicio de obras o futura, registro de otra comuna): el registro va
  a `rechazados/`, con su motivo.
- **Etapa ya registrada en otra fila:** no la duplica. Va a `procesados/` con la fila existente.
- **Registro ya escrito** (su `ref` ya está en Detalle): no lo repite.

Cada registro pasa a `procesados/` o `rechazados/`, con un `.resultado.json` al lado que indica la
fila, el ID y lo que dice «Control». Nada se borra. Las versiones anteriores de la planilla quedan en
el historial de Dropbox, y además se guardan copias locales en `carpeta_trabajo`.

## Instalación en el PC

1. Instalar LibreOffice. El script se ejecuta con el Python que trae LibreOffice, que ya incluye `uno`.
2. Copiar `config.ejemplo.json` como `config.json` **fuera de este repositorio** y completarlo:
   - `dropbox`: las mismas credenciales de la app de Dropbox de la empresa. También se pueden dar por
     las variables de entorno `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET` y `DROPBOX_REFRESH_TOKEN`.
   - `comunas`: para cada comuna, la carpeta de cola y la ruta de la planilla en Dropbox.
     **Durante las pruebas, la planilla debe ser una copia** (por ejemplo, en `_Ejemplo (ficticio)`).
3. Probar a mano:
   ```
   "C:\Program Files\LibreOffice\program\python.exe" escribir_parte.py --config C:\ParteDiario\config.json
   ```
4. Programarlo en el Programador de tareas de Windows con ese mismo comando. El log queda en
   `carpeta_trabajo\registro.log`.

## Prueba local, sin Dropbox

```
python escribir_parte.py --planilla copia.xlsx --cola carpeta_con_json --salida copia_escrita.xlsx
```

## En la app (Vercel)

La variable `EVIDENCIAS_PARTE_COLA` es la carpeta raíz de la cola en Dropbox, por ejemplo
`/Proyectos/2026-DPR-ANF_OPERACIONES/Común/Cola parte diario`. La app agrega
`/<Comuna>`, o `/_PILOTO/<Comuna>` mientras está en modo piloto. Si la variable no está, la app no deja
nada en cola.
