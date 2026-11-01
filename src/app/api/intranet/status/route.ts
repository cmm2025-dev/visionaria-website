import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetSession, isIntranetAdmin, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { projectsFor } from '@/lib/projects';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  const session = cookie ? decodeIntranetSession(cookie) : null;
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'es';
  return NextResponse.json({
    email: session.email,
    isAdmin: isIntranetAdmin(session.email),
    projects: projectsFor(session.email, locale),
  });
}
