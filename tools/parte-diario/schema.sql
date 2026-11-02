-- Parte diario en línea. Nada se borra: los registros se anulan y cada cambio deja un evento.

CREATE TABLE IF NOT EXISTS comunas (
  comuna        text PRIMARY KEY,
  prefijo       text NOT NULL,                 -- ANT, CAL, TOC
  planilla      text,                          -- ruta de la planilla de terreno en Dropbox
  colas         text[] NOT NULL DEFAULT '{}',  -- carpetas de cola que alimenta la app
  rev_generada  text,                          -- revisión de Dropbox que dejó la última generación
  generada_en   timestamptz,
  filas_generadas jsonb,                       -- {fila: [B..H]} tal como quedó escrito; detecta ediciones a mano
  ultimo_aviso  text                           -- para no repetir el mismo aviso en cada ciclo
);

CREATE TABLE IF NOT EXISTS registros (
  id              text PRIMARY KEY,            -- id de captura de la app, o manual:<comuna>:<fila>
  comuna          text NOT NULL REFERENCES comunas,
  fila            integer NOT NULL,            -- fila en la hoja «Parte diario»; nunca cambia
  id_planilla     text NOT NULL,               -- TOC-P0001, calculado desde la fila
  fecha           date NOT NULL,
  punto           text NOT NULL,
  hecho           text NOT NULL,
  tipo            text,                        -- Etapa / Novedad, según la app
  ejecuto         text,
  observacion     text,
  registrado_por  text,                        -- correo del técnico; nadie registra a nombre de otro
  gps_lat         double precision,
  gps_lon         double precision,
  gps_precision   integer,
  gps_origen      text,                        -- camera / gallery
  foto            text NOT NULL DEFAULT '',    -- Sí / No / '' tal como va en la columna G
  piloto          boolean NOT NULL DEFAULT false,
  origen          text NOT NULL,               -- app / manual
  detalle_manual  text,                        -- filas importadas: el Detalle tal como estaba escrito
  guardado_en     timestamptz,                 -- cuándo lo guardó el técnico en el teléfono
  recibido_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  anulado_en      timestamptz,
  anulado_por     text,
  motivo_anulacion text,
  control         text,                        -- lo que dijo «Control» en la última generación
  nombre_foto     text,
  UNIQUE (comuna, fila)
);
CREATE INDEX IF NOT EXISTS registros_comuna_actualizado ON registros (comuna, actualizado_en);

CREATE TABLE IF NOT EXISTS fotos (
  id          bigserial PRIMARY KEY,
  registro_id text NOT NULL REFERENCES registros,
  nombre      text NOT NULL,
  ruta        text,
  toma        text,                            -- código de la toma del protocolo, si aplica
  dropbox_id  text,
  hash        text
);
CREATE INDEX IF NOT EXISTS fotos_registro ON fotos (registro_id);

CREATE TABLE IF NOT EXISTS eventos (
  id          bigserial PRIMARY KEY,
  en          timestamptz NOT NULL DEFAULT now(),
  tipo        text NOT NULL,                   -- recibido, rechazado, anulado, importado, generada, aviso, ...
  comuna      text,
  registro_id text,
  quien       text,
  detalle     jsonb
);

-- Levantamiento en terreno (formulario DEC-020): un punto, un levantamiento vigente; cada envío queda guardado.
CREATE TABLE IF NOT EXISTS levantamientos (
  codigo          text PRIMARY KEY,            -- código del punto (columna A del formulario)
  comuna          text NOT NULL,
  valores         jsonb NOT NULL,              -- {columna: valor} de S..BU, ya validados contra el contrato
  fotos           jsonb NOT NULL DEFAULT '[]', -- [{toma, nombre, ruta}]
  gps             jsonb,                       -- la coordenada tal como la dio el teléfono, con su precisión
  registrado_por  text,
  envio_id        text NOT NULL,               -- el envío que dejó estos valores
  guardado_en     timestamptz NOT NULL,        -- cuándo lo guardó el técnico; gana el más reciente
  recibido_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  control         text                         -- lo que dijo «Control» en la última generación
);

CREATE TABLE IF NOT EXISTS levantamiento_envios (
  id           text PRIMARY KEY,               -- id de envío de la app
  codigo       text NOT NULL,
  contenido    jsonb NOT NULL,                 -- el JSON tal como llegó
  estado       text NOT NULL,                  -- vigente / reemplazado / anterior (llegó después uno más nuevo)
  recibido_en  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planilla_levantamiento (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rev_generada    text,
  generada_en     timestamptz,
  filas_generadas jsonb,                       -- {codigo: [S..BU]} tal como quedó escrito; detecta ediciones a mano
  ultimo_aviso    text
);

-- Levantamiento v2 (DEC-020 y vía rápida): de qué formulario es cada punto, la coordenada del poste CGE y el trámite.
-- Las claves de «valores» pasan a ser los encabezados del formulario (parte migrar convierte lo de la v1).
ALTER TABLE levantamientos ADD COLUMN IF NOT EXISTS formulario text;
ALTER TABLE levantamientos ADD COLUMN IF NOT EXISTS gps_poste jsonb;
ALTER TABLE levantamientos ADD COLUMN IF NOT EXISTS tramite text;
CREATE TABLE IF NOT EXISTS planillas_levantamiento (
  formulario      text PRIMARY KEY,            -- DEC-020, VR-Antofagasta, …
  rev_generada    text,
  generada_en     timestamptz,
  filas_generadas jsonb,                       -- {codigo: [campos]} tal como quedó escrito; detecta ediciones a mano
  ultimo_aviso    text
);

-- Correos del contrato (DIR-P07): cada envío o intento, con su asunto final. Nada se borra.
CREATE TABLE IF NOT EXISTS correos (
  id            bigserial PRIMARY KEY,
  en            timestamptz NOT NULL DEFAULT now(),
  en_chile      text NOT NULL,                 -- fecha y hora en America/Santiago, tal como se informa
  evento        text NOT NULL,                 -- clave del hecho; los avisos del mismo hecho van en el mismo hilo
  tipo          text NOT NULL,                 -- INT / CL / EXT
  tema          text NOT NULL,
  asunto        text NOT NULL,                 -- el asunto final, con el prefijo
  para          text[] NOT NULL,
  estado        text NOT NULL,                 -- enviado / rechazado / sin_configurar / error
  detalle       text,
  proveedor_id  text                           -- id que devolvió Resend
);
CREATE INDEX IF NOT EXISTS correos_evento ON correos (evento);
