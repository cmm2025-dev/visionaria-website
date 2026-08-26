import { NextRequest, NextResponse } from 'next/server';
import { decodeMagicLink, encodeSession, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const payload = token ? decodeMagicLink(token) : null;

  if (!payload) {
    return NextResponse.redirect(new URL('/es/soporte/estado?error=1', req.nextUrl.origin));
  }

  const cookieValue = encodeSession({ email: payload.email, issuedAt: Date.now() });
  const res = NextResponse.redirect(new URL(`/${payload.locale}/soporte/${payload.next}`, req.nextUrl.origin));
  res.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
