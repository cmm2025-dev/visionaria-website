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
