import { readFileSync } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';

export const runtime = 'nodejs';

// Explicit whitelist -- never resolve an on-disk path from the request directly, so there is no
// path-traversal surface regardless of how Next.js decodes the dynamic segment.
const ASSETS: Record<string, string> = {
  'app.mjs': 'application/javascript; charset=utf-8',
  'core.mjs': 'application/javascript; charset=utf-8',
  'storage.mjs': 'application/javascript; charset=utf-8',
  'dropbox-client.mjs': 'application/javascript; charset=utf-8',
  'catalogue.json': 'application/json; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
  'icon.svg': 'image/svg+xml',
  'manifest.webmanifest': 'application/manifest+json',
  'sw.js': 'application/javascript; charset=utf-8',
};

const ASSETS_DIR = path.join(process.cwd(), 'src', 'evidencias-assets');

export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { file } = await params;
  const contentType = ASSETS[file];
  if (!contentType) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = readFileSync(path.join(ASSETS_DIR, file));
  return new NextResponse(body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'private, no-cache' } });
}
