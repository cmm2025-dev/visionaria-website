import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';
import { getPanelSnapshot } from '@/lib/panelStore';

export const runtime = 'nodejs';

/**
 * The levantamiento status of every point, from the summary the office service pushes for the panel, so the
 * Evidencias app can show the team's progress per comuna. Only the status leaves the panel: no values, no photos.
 */
export async function GET(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const snapshot = await getPanelSnapshot().catch(() => null);
  return NextResponse.json(
    { generado: snapshot?.generado ?? null, levantamientos: snapshot?.levantamientos ?? [] },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
