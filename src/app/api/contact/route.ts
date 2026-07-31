import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/** Escape for HTML text nodes and double-quoted attributes. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Control chars (incl. CR/LF/NUL) — must never reach an email header. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
/** Zero-width / invisible chars used for homoglyph and filter-evasion tricks. */
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

/** Sanitize a single-line value destined for an email header. */
function cleanHeader(s: string): string {
  return s.replace(CONTROL_CHARS, ' ').replace(INVISIBLE_CHARS, '').trim();
}

/** Sanitize the message body — newlines are legitimate here, other control chars are not. */
function cleanBody(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(INVISIBLE_CHARS, '')
    .trim();
}

/**
 * Conservative addr-spec check. Deliberately rejects `?`, `&`, `<`, `>`, `"`, quotes and
 * all non-ASCII, so the value is safe both as a Reply-To header and inside a mailto: URL.
 */
function isValidEmail(e: string): boolean {
  return e.length <= 254 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e);
}

/**
 * Best-effort in-memory throttle — defense-in-depth only. Each serverless instance has its
 * own Map, so this cannot enforce a global limit; the same-origin check and honeypot below
 * carry most of the weight. For a hard global cap, move this to Vercel KV / Upstash Redis.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const MAX_TRACKED = 5000;
const hits = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of hits) {
    if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  }
  if (hits.size > MAX_TRACKED) {
    // Map preserves insertion order — evict the oldest entries.
    for (const k of [...hits.keys()].slice(0, hits.size - MAX_TRACKED)) hits.delete(k);
  }
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  sweep(now);
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** Platform-set headers only — never the leftmost x-forwarded-for hop, which the client controls. */
function clientIp(req: Request): string | null {
  const real = req.headers.get('x-real-ip');
  if (real?.trim()) return real.trim();
  // Vercel appends the true peer as the rightmost XFF entry.
  const parts = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
}

const NO_STORE = { 'Cache-Control': 'no-store' };

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function POST(req: Request) {
  // Reject cross-origin submissions. Blocks the CORS-safelisted "simple request" trick where
  // any site drives its visitors' browsers into POSTing this endpoint from residential IPs.
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') {
    return json({ error: 'Forbidden.' }, 403);
  }

  // Compare the MIME essence only — `.includes()` would match `text/plain; x=application/json`,
  // which is CORS-safelisted and needs no preflight.
  const contentType = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return json({ error: 'Unsupported media type.' }, 415);
  }

  const ip = clientIp(req);
  // Don't funnel unidentifiable clients into one shared bucket — reject instead.
  if (!ip) return json({ error: 'Forbidden.' }, 403);
  if (rateLimited(ip)) {
    return json({ error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' }, 429);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    return json({ error: 'Servicio no disponible.' }, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { name, email, company, message, website } = body as Record<string, unknown>;

  // Honeypot: a hidden field real users never fill. Accept silently so bots can't tell.
  if (typeof website === 'string' && website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return json({ error: 'Faltan campos requeridos.' }, 400);
  }

  const nameC = cleanHeader(name);
  const emailC = cleanHeader(email);
  const companyC = typeof company === 'string' ? cleanHeader(company).slice(0, 120) : '';
  const messageC = cleanBody(message);

  if (!nameC || !emailC || !messageC) {
    return json({ error: 'Faltan campos requeridos.' }, 400);
  }
  if (nameC.length > 120 || emailC.length > 254 || messageC.length > 4000) {
    return json({ error: 'Datos exceden el largo permitido.' }, 400);
  }
  if (!isValidEmail(emailC)) {
    return json({ error: 'Email inválido.' }, 400);
  }

  // Corporate address as fallback so a missing env var never silently drops leads.
  const to = process.env.CONTACT_TO_EMAIL ?? 'info@visionaria.cl';

  // Constructed per-request: a module-scope `new Resend()` throws at import time when the
  // key is absent, which breaks `next build` during page-data collection.
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL ?? 'Formulario Web <onboarding@resend.dev>',
    to: [to],
    replyTo: emailC,
    subject: `Nuevo contacto: ${nameC}${companyC ? ` — ${companyC}` : ''}`,
    text: `Nombre: ${nameC}\nEmail: ${emailC}\nEmpresa: ${companyC || '—'}\n\n${messageC}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#060d2e">Nuevo mensaje de contacto</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;width:100px">Nombre</td><td style="padding:8px 0;font-weight:600">${esc(nameC)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${encodeURIComponent(emailC)}">${esc(emailC)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Empresa</td><td style="padding:8px 0">${esc(companyC) || '—'}</td></tr>
        </table>
        <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
        <p style="white-space:pre-wrap;color:#222">${esc(messageC)}</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', JSON.stringify(error));
    return json({ error: 'Error al enviar el mensaje.' }, 500);
  }

  return json({ ok: true }, 200);
}
