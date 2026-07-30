import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple HTML escape to prevent injection in email body
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Basic email format check
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// In-memory sliding window: 5 requests per 10 minutes per IP
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export async function POST(req: Request) {
  // Content-Type guard
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported media type.' }, { status: 415 });
  }

  // Rate limit by client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' },
      { status: 429 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { name, email, company, message } = body as Record<string, unknown>;

  // Type + presence checks
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }
  if (!name.trim() || !email.trim() || !message.trim()) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
  }

  // Length limits
  if (name.length > 120 || email.length > 254 || message.length > 4000) {
    return NextResponse.json({ error: 'Datos exceden el largo permitido.' }, { status: 400 });
  }

  // Email format
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }

  const companyStr = typeof company === 'string' ? company.slice(0, 120) : '';

  const to = process.env.CONTACT_TO_EMAIL ?? 'cesar.visionaria@gmail.com';

  const { error } = await resend.emails.send({
    from: 'Formulario Web <onboarding@resend.dev>',
    to: [to],
    replyTo: email,
    subject: `Nuevo contacto: ${name}${companyStr ? ` — ${companyStr}` : ''}`,
    text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${companyStr || '—'}\n\n${message}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#060d2e">Nuevo mensaje de contacto</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;width:100px">Nombre</td><td style="padding:8px 0;font-weight:600">${esc(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Empresa</td><td style="padding:8px 0">${esc(companyStr) || '—'}</td></tr>
        </table>
        <hr style="margin:16px 0;border:none;border-top:1px solid #eee"/>
        <p style="white-space:pre-wrap;color:#222">${esc(message)}</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', JSON.stringify(error));
    return NextResponse.json({ error: 'Error al enviar el mensaje.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
