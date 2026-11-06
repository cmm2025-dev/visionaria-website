import { NextRequest, NextResponse } from 'next/server';
import { accesoEvidencias } from '@/lib/evidenciasAuth';
import { getPanelSnapshot } from '@/lib/panelStore';

export const runtime = 'nodejs';

/**
 * The levantamiento status of every point, from the summary the office service pushes for the panel, so the
 * Evidencias app can show the team's progress per comuna. Only the status leaves the panel: no values, no photos.
 */
export async function GET(req: NextRequest) {
  const acceso = await accesoEvidencias(req);
  if (!acceso) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const snapshot = await getPanelSnapshot().catch(() => null);
  return NextResponse.json(
    // Someone with only a fiber-quality account (an outside contractor) does not see the survey of the rest of the project.
    acceso.completo ? { generado: snapshot?.generado ?? null, levantamientos: snapshot?.levantamientos ?? [], fibra: snapshot?.fibra ?? [] }
      : { generado: snapshot?.generado ?? null, levantamientos: [], fibra: [] },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
