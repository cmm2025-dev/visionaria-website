import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetMagicLink, encodeIntranetSession, isStaffEmail, INTRANET_SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const payload = token ? decodeIntranetMagicLink(token) : null;

  // Re-check the domain at verify time too, not just at request time -- defense in depth in
  // case a token is ever minted or replayed outside the request flow above.
  if (!payload || !isStaffEmail(payload.email)) {
    return NextResponse.redirect(new URL('/es/intranet?error=1', req.nextUrl.origin));
  }

  const cookieValue = encodeIntranetSession({ email: payload.email, issuedAt: Date.now() });
  const res = NextResponse.redirect(new URL(`/${payload.locale}/intranet`, req.nextUrl.origin));
  res.cookies.set(INTRANET_SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
