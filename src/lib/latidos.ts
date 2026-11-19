import { put, get, list } from '@vercel/blob';
import { sealJson, openJson, panelName } from '@/lib/panelStore';

/**
 * Each phone's heartbeat: how many records it still holds and since when. The Evidencias app sends it when it opens,
 * comes back and every few minutes; the executive panel lists them so the office sees a phone that keeps records
 * unsent. Only counts and dates, never the records. Encrypted like the panel summary, one blob per person and phone.
 */

export interface Latido {
  email: string;
  dispositivo: string;
  etiqueta: string;
  evidencias: number;
  levantamiento: number;
  /** ISO of the oldest record still on the phone, or null when nothing is pending. */
  masAntiguo: string | null;
  visto: string;
}

const PREFIJO = 'intranet/panel/latidos/';
/** A phone not heard from in this long is dropped from the list (its blob stays). */
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;

const entero = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < 100000 ? (v as number) : 0);

export function leerLatido(email: string, body: unknown): Latido | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const dispositivo = typeof b.dispositivo === 'string' ? b.dispositivo.slice(0, 64) : '';
  if (!/^[\w-]{4,64}$/.test(dispositivo)) return null;
  const fecha = typeof b.masAntiguo === 'string' && !Number.isNaN(Date.parse(b.masAntiguo)) ? new Date(b.masAntiguo).toISOString() : null;
  return {
    email,
    dispositivo,
    etiqueta: typeof b.etiqueta === 'string' ? b.etiqueta.replace(/[^\w .,()/-]/g, '').slice(0, 40) : '',
    evidencias: entero(b.evidencias),
    levantamiento: entero(b.levantamiento),
    masAntiguo: fecha,
    visto: new Date().toISOString(),
  };
}

export async function guardarLatido(latido: Latido): Promise<void> {
  await put(`${PREFIJO}${panelName(`latido:${latido.email}|${latido.dispositivo}`)}.bin`, sealJson(latido), {
    access: 'private',
    contentType: 'application/octet-stream',
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

/** Heard from in the last 30 days, the ones with the oldest pending record first. */
export async function listarLatidos(): Promise<Latido[]> {
  const desde = Date.now() - VIGENCIA_MS;
  const blobs = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIJO, cursor });
    blobs.push(...page.blobs.filter(b => new Date(b.uploadedAt).getTime() >= desde));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const latidos = await Promise.all(blobs.map(async b => {
    const res = await get(b.pathname, { access: 'private', useCache: false }).catch(() => null);
    if (res?.statusCode !== 200) return null;
    try {
      return openJson<Latido>(Buffer.from(await new Response(res.stream).arrayBuffer()));
    } catch {
      return null;
    }
  }));
  const pendientes = (l: Latido) => l.evidencias + l.levantamiento;
  return latidos
    .filter((l): l is Latido => !!l)
    .sort((a, b) => (pendientes(b) > 0 ? 1 : 0) - (pendientes(a) > 0 ? 1 : 0)
      || (a.masAntiguo ?? '').localeCompare(b.masAntiguo ?? '')
      || b.visto.localeCompare(a.visto));
}
