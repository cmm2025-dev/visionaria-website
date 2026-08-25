import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getZohoUserEmail } from '@/lib/zoho';
import { encodeSession, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const [rawLocale, rawNext] = (req.nextUrl.searchParams.get('state') ?? '').split(':');
  const locale = rawLocale === 'en' ? 'en' : 'es';
  const page = rawNext === 'documentos' || rawNext === 'nuevo-ticket' ? rawNext : 'estado';
  const errorRedirect = NextResponse.redirect(new URL(`/${locale}/soporte/${page}?error=1`, req.nextUrl.origin));

  if (!code) return errorRedirect;

  try {
    const redirectUri = `${req.nextUrl.origin}/api/auth/zoho/callback`;
    const { access_token } = await exchangeCodeForToken(code, redirectUri);
    const email = await getZohoUserEmail(access_token);

    const cookieValue = encodeSession({ email, issuedAt: Date.now() });
    const res = NextResponse.redirect(new URL(`/${locale}/soporte/${page}`, req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    console.error('Zoho callback failed', err);
    return errorRedirect;
  }
}
