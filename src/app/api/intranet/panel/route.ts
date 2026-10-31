import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetSession, isPanelViewer, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { getPanelSnapshot } from '@/lib/panelStore';
import catalogue from '@/evidencias-assets/catalogue.json';

export const runtime = 'nodejs';

// Points per comuna come from the same catalogue the Evidencias app offers, so "puntos con avance"
// is measured against the points a technician can actually register.
const PUNTOS = (catalogue as { code: string; commune: string; type: string; address: string }[])
  .map(p => ({ code: p.code, comuna: p.commune, tipo: p.type, direccion: p.address }));

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  const session = cookie ? decodeIntranetSession(cookie) : null;
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!isPanelViewer(session.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const snapshot = await getPanelSnapshot();
    return NextResponse.json({ snapshot, puntos: PUNTOS }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'panel unavailable' }, { status: 500 });
  }
}
