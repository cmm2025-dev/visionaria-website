/**
 * Server-side Dropbox connection for the Evidencias de Terreno tool. One central, company-owned
 * Dropbox app (refresh token never expires unless revoked) replaces the old per-technician OAuth
 * flow -- technicians never see the app secret or refresh token, only a short-lived access token
 * minted on demand for an authenticated, allowlisted session. The actual photo upload still goes
 * directly from the browser to Dropbox (not through our server) so it is never bound by Vercel's
 * serverless request-body size limit.
 */

export const COMMUNES = ['Antofagasta', 'Calama', 'Tocopilla'] as const;

export function evidenciasRoot(): string {
  return process.env.EVIDENCIAS_DROPBOX_ROOT ?? '/2026-DPR-ANF_OPERACIONES';
}

export function evidenciasPilotMode(): boolean {
  const v = process.env.EVIDENCIAS_PILOT_MODE;
  return v === undefined ? true : v === '1' || v.toLowerCase() === 'true';
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedPathRoot: string | null = null;

function requireDropboxEnv() {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  if (!appKey || !appSecret || !refreshToken) {
    throw new Error('Dropbox no está configurado todavía (faltan DROPBOX_APP_KEY/APP_SECRET/REFRESH_TOKEN).');
  }
  return { appKey, appSecret, refreshToken };
}

async function freshAccessToken(): Promise<{ token: string; expiresAt: number }> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60_000) return cachedToken;
  const { appKey, appSecret, refreshToken } = requireDropboxEnv();
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: appKey, client_secret: appSecret }),
  });
  if (!response.ok) throw new Error('No se pudo renovar el acceso a Dropbox. Revisa las credenciales de la app.');
  const data = await response.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken;
}

/** Full Dropbox team accounts need the root namespace header; cached once per server process. */
async function pathRootFor(token: string): Promise<string | null> {
  if (cachedPathRoot !== null) return cachedPathRoot || null;
  try {
    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    cachedPathRoot = res.ok ? ((await res.json())?.root_info?.root_namespace_id ?? '') : '';
  } catch {
    cachedPathRoot = '';
  }
  return cachedPathRoot || null;
}

/** Mints a short-lived Dropbox access token for an already-authorized technician's browser session. */
export async function mintDropboxToken(): Promise<{ token: string; expiresAt: number; pathRoot: string | null }> {
  const { token, expiresAt } = await freshAccessToken();
  const pathRoot = await pathRootFor(token);
  return { token, expiresAt, pathRoot };
}
