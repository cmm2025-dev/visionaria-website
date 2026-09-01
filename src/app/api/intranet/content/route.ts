import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetSession, isIntranetAdmin, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { getIntranetLinks, saveIntranetLinks, type IntranetLink } from '@/lib/intranetContent';

export const runtime = 'nodejs';

function requireSession(req: NextRequest) {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  return cookie ? decodeIntranetSession(cookie) : null;
}

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const links = await getIntranetLinks();
  return NextResponse.json({ links });
}

/** Only the allowlisted intranet admins can write content -- anyone else with a valid staff session can only read it. */
export async function PUT(req: NextRequest) {
  const session = requireSession(req);
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!isIntranetAdmin(session.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const items = (body as { links?: unknown }).links;
  if (!Array.isArray(items) || items.length > 100) {
    return NextResponse.json({ error: 'invalid_links' }, { status: 400 });
  }

  const links: IntranetLink[] = [];
  for (const item of items) {
    const label = String((item as Record<string, unknown>)?.label ?? '').trim().slice(0, 200);
    const url = String((item as Record<string, unknown>)?.url ?? '').trim().slice(0, 2000);
    if (!label || !url) continue;
    const existingId = String((item as Record<string, unknown>)?.id ?? '').trim();
    links.push({ id: existingId || randomUUID(), label, url });
  }

  await saveIntranetLinks(links);
  return NextResponse.json({ ok: true, links });
}
