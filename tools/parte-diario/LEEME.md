# Parte diario en línea

La base de datos es la fuente y la planilla de terreno (DPR-04-PL-00n) se regenera desde ella. Desde la fecha
de corte, **nadie escribe a mano en la hoja «Parte diario»**: lo que hay que anotar entra por la app
Evidencias, y lo que hay que anular, por el comando `anular`. Las demás hojas de la planilla no se tocan.

```
Teléfono (app Evidencias) ─ fotos ──────────► Dropbox/<Comuna>/Fotos
                          └ registro JSON ───► Dropbox/Común/Cola parte diario/<Comuna>
                                                      │
Servidor (Docker, solo conexiones salientes)          ▼
   ingesta: cola → PostgreSQL (una fila fija por registro)
   generación: PostgreSQL → «Parte diario» (LibreOffice) → Dropbox, con revisión condicionada
```

## Qué escribe en la planilla

Solo las columnas de ingreso B..H de cada fila; A (ID), I (Nombre de la foto), J (Control) y K (Tipo) las
calcula la planilla y quedan guardadas en el archivo.

| Columna | Valor |
|---|---|
| B Fecha | fecha del hecho |
| C Punto | código del punto, o GENERAL |
| D Hecho | texto exacto de la lista de la planilla |
| E Ejecutó | lo que eligió el técnico (obligatorio en etapas) |
| F Detalle | observación · GPS lat, lon ±m · a N m del punto KMZ · registró usuario |
| G Foto | Sí / No |
| H Anular | «Anulada» si el registro está anulado |

Cada registro recibe su fila al entrar a la base y no cambia nunca, así que el ID (`TOC-P0012`) es estable.

## Qué pasa si alguien edita la planilla a mano

El servicio compara lo que hay con lo que él mismo escribió la última vez:

- **«Anulada» escrita en H**: se absorbe como anulación (es lo que pide la instrucción 7 de la planilla).
- **Filas nuevas escritas a mano**: avisa y no regenera. Se importan con `parte importar --comuna X`; si una ocupa
  la fila ya asignada a un registro de la app que aún no estaba en la planilla, ese registro se corre al final.
- **Filas cambiadas o vaciadas**: avisa y no regenera. Se decide con `parte resolver --comuna X --prevalece bd`
  (la base manda; lo descartado queda en eventos) o `--prevalece planilla` (lo escrito a mano pasa a la base).

Los avisos quedan en `Cola parte diario/<Comuna>/AVISOS/` y en la tabla `eventos`. También espera si la planilla
cambió hace menos de `PARTE_REPOSO_MIN` minutos o tiene un archivo de bloqueo de Excel al lado, y nunca pisa una
versión que no haya leído (si la planilla cambió durante la generación, reintenta en el ciclo siguiente).

## Instalación en el servidor (Ubuntu con Docker)

```bash
git clone -b <rama> https://github.com/cmm2025-dev/visionaria-website.git /opt/visionaria-website
cd /opt/visionaria-website/tools/parte-diario
./instalar.sh            # crea .env y comunas.json la primera vez; completarlos y volver a ejecutar
```

- `.env`: credenciales de Dropbox (las mismas de la app en Vercel) y contraseña de la base local. No se sube al repositorio.
- `comunas.json`: por comuna, el prefijo, la ruta de la planilla y las carpetas de cola. **Durante las pruebas la
  planilla debe ser una copia** (por ejemplo, en `_Ejemplo (ficticio)`), y la cola la de `_PILOTO/<Comuna>`.
- PostgreSQL vive en un volumen de Docker y no expone puertos. Respaldo diario a Dropbox si se define
  `PARTE_RESPALDO_DROPBOX`.

Actualizar: `git pull && docker compose up -d --build`. Registro: `docker compose logs -f parte`.

## Comandos

```bash
./parte.sh estado --comuna Tocopilla                 # filas, ID y lo que dice Control
./parte.sh anular TOC-P0012 --por correo --motivo "…"  # la planilla se actualiza en el próximo ciclo
./parte.sh importar --comuna Tocopilla               # filas escritas a mano → base de datos
./parte.sh resolver --comuna Tocopilla --prevalece bd|planilla
./parte.sh generar                                   # forzar una regeneración
./parte.sh respaldar                                 # pg_dump a Dropbox ahora
```

## La app (Vercel)

`EVIDENCIAS_PARTE_COLA` es la carpeta raíz de la cola en Dropbox, por ejemplo
`/Proyectos/2026-DPR-ANF_OPERACIONES/Común/Cola parte diario`. La app agrega `/<Comuna>`, o `/_PILOTO/<Comuna>`
mientras está en modo piloto. Cuando la variable está definida, las novedades pueden guardarse sin foto.

Lo que el servicio deja en la cola para la app: `<cola>/procesados/<registro>.resultado.json` (fila e ID
asignados) y `<cola>/estado/<Comuna>.json` (todas las filas con su Control, tras cada generación).

## Prueba sin Dropbox ni servidor

Con PostgreSQL y LibreOffice locales, `PARTE_DB` apuntando a una base de prueba y un Dropbox simulado se puede
recorrer todo el flujo; así se probó esta versión sobre una copia de la planilla de Tocopilla.
