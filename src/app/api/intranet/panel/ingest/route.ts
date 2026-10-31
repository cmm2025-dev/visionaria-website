import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isPanelSnapshot, savePanelSnapshot } from '@/lib/panelStore';

export const runtime = 'nodejs';

/** Compares hashes so neither the length nor the content of the token leaks through timing. */
function sameToken(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The parte diario service pushes its summary here; nothing else writes the panel. */
export async function POST(req: NextRequest) {
  const expected = process.env.PANEL_INGEST_TOKEN;
  if (!expected || expected.length < 32) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || !sameToken(auth.slice(7), expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!isPanelSnapshot(body)) return NextResponse.json({ error: 'invalid summary' }, { status: 400 });
  await savePanelSnapshot(body);
  return NextResponse.json({ ok: true, registros: body.registros.length });
}
