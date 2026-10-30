import { NextResponse } from 'next/server';
import { INTRANET_SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(INTRANET_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
