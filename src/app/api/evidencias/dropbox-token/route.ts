import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';
import { mintDropboxToken } from '@/lib/dropboxServer';

export const runtime = 'nodejs';

/**
 * Mints a short-lived Dropbox access token for the browser to call Dropbox's upload API directly.
 * Uploads never pass through our own server -- Vercel's serverless functions cap request bodies
 * around 4.5MB, well under the 25MB per-photo limit this tool allows.
 */
export async function GET(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { token, expiresAt, pathRoot } = await mintDropboxToken();
    return NextResponse.json({ token, expiresAt, pathRoot });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'dropbox_not_configured' }, { status: 503 });
  }
}
