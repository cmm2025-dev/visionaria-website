import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';
import { guardarLatido, leerLatido } from '@/lib/latidos';

export const runtime = 'nodejs';

/** A phone reports how many records it still holds; the email comes from the session, never from the phone. */
export async function POST(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const latido = leerLatido(email, await req.json().catch(() => null));
  if (!latido) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  try {
    await guardarLatido(latido);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'unavailable' }, { status: 503 });
  }
}
