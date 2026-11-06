import { NextRequest, NextResponse } from 'next/server';
import { requireEvidenciasTech } from '@/lib/evidenciasAuth';
import { emailInAllowlists } from '@/lib/session';
import { hasProjectRole } from '@/lib/projects';
import { evidenciasRoot, evidenciasPilotMode, evidenciasParteQueue, evidenciasLevantamientoQueue } from '@/lib/dropboxServer';

export const runtime = 'nodejs';

/**
 * Who sees everything in the app, «Por ubicar» points included: Iván Andaur, who assigns the survey, and management
 * (directors, Gestión y control). EVIDENCIAS_VER_TODO_EMAILS can add more people without a deploy.
 */
function verTodo(email: string): boolean {
  return email.trim().toLowerCase() === 'iandaur@visionaria.cl'
    || hasProjectRole(email, 'dpr-antofagasta', 'gestion')
    || emailInAllowlists(email, ['EVIDENCIAS_VER_TODO_EMAILS']);
}

export async function GET(req: NextRequest) {
  const email = requireEvidenciasTech(req);
  if (!email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({
    email,
    root: evidenciasRoot(),
    pilot: evidenciasPilotMode(),
    parteQueue: evidenciasParteQueue(),
    levantamientoQueue: evidenciasLevantamientoQueue(),
    verTodo: verTodo(email),
    verPorUbicar: verTodo(email),
  });
}
