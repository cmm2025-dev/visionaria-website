import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { encodeMagicLink } from '@/lib/session';
import { findContactByEmail, getServiceAccessToken } from '@/lib/zoho';

export const runtime = 'nodejs';

const VALID_NEXT = ['estado', 'documentos', 'nuevo-ticket', 'mesa-ayuda'];

function isValidEmail(e: string): boolean {
  return e.length <= 254 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e);
}

/**
 * Requests a magic-link sign-in email. Always responds the same way whether or not the email
 * matches a registered contact, so this endpoint can't be used to enumerate client contacts.
 */
export async function POST(req: NextRequest) {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const locale = body.locale === 'en' ? 'en' : 'es';
  const next = VALID_NEXT.includes(String(body.next)) ? String(body.next) : 'estado';

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  try {
    const serviceToken = await getServiceAccessToken();
    const contact = await findContactByEmail(serviceToken, email);

    if (contact) {
      const token = encodeMagicLink({ email, next, locale });
      const magicUrl = `${req.nextUrl.origin}/api/auth/magic/verify?token=${encodeURIComponent(token)}`;

      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const subject = locale === 'en' ? 'Your Visionaria support sign-in link' : 'Tu enlace de acceso al soporte Visionaria';
        const greeting = locale === 'en'
          ? `Click the button below to sign in to the Visionaria client portal. This link expires in 15 minutes and can only be used once.`
          : `Haz clic en el botón para acceder al portal de clientes Visionaria. Este enlace expira en 15 minutos y solo se puede usar una vez.`;
        const cta = locale === 'en' ? 'Sign in' : 'Iniciar sesión';
        await resend.emails.send({
          from: process.env.CONTACT_FROM_EMAIL ?? 'Soporte Visionaria <onboarding@resend.dev>',
          to: [email],
          subject,
          text: `${greeting}\n\n${magicUrl}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px">
              <p style="color:#222">${greeting}</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${magicUrl}" style="background:#F09422;color:#1E1B18;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;display:inline-block">${cta}</a>
              </p>
              <p style="color:#888;font-size:12px">${magicUrl}</p>
            </div>
          `,
        });
      } else {
        console.error('RESEND_API_KEY not set — magic link email not sent');
      }
    }
  } catch (err) {
    console.error('magic/request failed', err);
    // Fall through to the generic response below regardless — never leak whether it worked.
  }

  return NextResponse.json({ ok: true });
}
