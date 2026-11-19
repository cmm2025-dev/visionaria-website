import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetSession, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { hasProjectRole } from '@/lib/projects';
import { getPanelSnapshot } from '@/lib/panelStore';
import { listarLatidos } from '@/lib/latidos';
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
  if (!hasProjectRole(session.email, 'dpr-antofagasta', 'gestion')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    // The phones' heartbeats are a side list: if they cannot be read the panel still shows the office summary.
    const [snapshot, telefonos] = await Promise.all([getPanelSnapshot(), listarLatidos().catch(() => [])]);
    return NextResponse.json({ snapshot, puntos: PUNTOS, telefonos }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'panel unavailable' }, { status: 500 });
  }
}
