import { NextRequest, NextResponse } from 'next/server';
import { decodeIntranetSession, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { getProject, projectRoles } from '@/lib/projects';
import { getPersonas, savePersonas, validarPersonas, ROL_PERSONA_LABEL } from '@/lib/personas';

export const runtime = 'nodejs';

/** Only the project's administrators of «Personas del proyecto» (and the Intranet admins) read or change the list. */
function admin(req: NextRequest, slug: string) {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  const session = cookie ? decodeIntranetSession(cookie) : null;
  const project = getProject(slug);
  if (!session || !project) return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  if (!projectRoles(session.email, project).includes('personas')) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { project, email: session.email };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = admin(req, slug);
  if ('error' in a) return a.error;
  return NextResponse.json({ personas: await getPersonas(slug), roles: ROL_PERSONA_LABEL, comunas: a.project.comunas },
    { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = admin(req, slug);
  if ('error' in a) return a.error;
  if (req.headers.get('sec-fetch-site') && req.headers.get('sec-fetch-site') !== 'same-origin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'El contenido no es válido.' }, { status: 400 });
  }
  const r = validarPersonas((body as { personas?: unknown })?.personas, a.project.comunas);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 });
  await savePersonas(slug, r.personas);
  console.info(`personas ${slug}: ${r.personas.length} guardadas por ${a.email}`);
  return NextResponse.json({ personas: r.personas });
}
