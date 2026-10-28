import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';

export const runtime = 'nodejs';

const HTML_PATH = path.join(process.cwd(), 'src', 'evidencias-assets', 'index.html');

/**
 * Serves the Evidencias de Terreno tool as a standalone HTML page, outside the normal [locale]
 * layout -- it has its own full-viewport sidebar/topbar chrome, so doubling it with the site's
 * Navbar/Footer would break the layout. Gated the same way as its /assets/* dependencies.
 */
export async function GET(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.redirect(new URL('/es/intranet', req.nextUrl.origin));

  const html = readFileSync(HTML_PATH, 'utf8');
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-cache' } });
}
