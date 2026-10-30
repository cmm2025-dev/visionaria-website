import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';
import { evidenciasRoot, evidenciasPilotMode, evidenciasParteQueue } from '@/lib/dropboxServer';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({
    email,
    root: evidenciasRoot(),
    pilot: evidenciasPilotMode(),
    parteQueue: evidenciasParteQueue(),
  });
}
