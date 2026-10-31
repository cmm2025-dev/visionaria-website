import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { put, head } from '@vercel/blob';

/**
 * The executive panel's data: a summary the parte diario service (on the office server) pushes here
 * every cycle. The office database is never exposed; only this summary leaves it. It holds emails, GPS
 * positions and field notes, and the Blob store is public, so it is stored AES-256-GCM encrypted under
 * a key derived from PANEL_INGEST_TOKEN, at a path derived from it too.
 */

export interface PanelComuna {
  comuna: string;
  prefijo: string;
  planilla: string | null;
  generada_en: string | null;
  ultimo_aviso: string | null;
}

export interface PanelRegistro {
  id: string;
  comuna: string;
  fecha: string;
  punto: string;
  hecho: string;
  tipo: string | null;
  ejecuto: string | null;
  detalle: string | null;
  foto: boolean;
  foto_ruta: string | null;
  control: string | null;
  anulado: boolean;
  registrado_por: string | null;
  lat: number | null;
  lon: number | null;
  origen: string;
  recibido_en: string | null;
  guardado_en: string | null;
}

export interface PanelSnapshot {
  generado: string;
  comunas: PanelComuna[];
  registros: PanelRegistro[];
}

function secret(): string {
  const token = process.env.PANEL_INGEST_TOKEN;
  if (!token || token.length < 32) throw new Error('PANEL_INGEST_TOKEN no está configurado (mínimo 32 caracteres).');
  return token;
}

const key = () => createHash('sha256').update(`${secret()}:panel-key`).digest();
const blobPath = () => `intranet/panel/${createHash('sha256').update(`${secret()}:panel-path`).digest('hex').slice(0, 32)}.bin`;

export function isPanelSnapshot(value: unknown): value is PanelSnapshot {
  const v = value as PanelSnapshot;
  return !!v && typeof v.generado === 'string' && Array.isArray(v.comunas) && Array.isArray(v.registros);
}

export async function savePanelSnapshot(snapshot: PanelSnapshot): Promise<void> {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(snapshot), 'utf8'), cipher.final()]);
  await put(blobPath(), Buffer.concat([iv, cipher.getAuthTag(), body]), {
    access: 'public',
    contentType: 'application/octet-stream',
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

/** null until the service has pushed its first summary. */
export async function getPanelSnapshot(): Promise<PanelSnapshot | null> {
  let url: string;
  try {
    url = (await head(blobPath())).url;
  } catch {
    return null;
  }
  // The query string skips the CDN copy, so a new summary shows up on the next poll.
  const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const raw = Buffer.from(await res.arrayBuffer());
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  return JSON.parse(json) as PanelSnapshot;
}
