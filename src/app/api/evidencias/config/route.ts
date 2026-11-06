import { NextRequest, NextResponse } from 'next/server';
import { accesoEvidencias } from '@/lib/evidenciasAuth';
import { emailInAllowlists } from '@/lib/session';
import { hasProjectRole } from '@/lib/projects';
import { evidenciasRoot, evidenciasPilotMode, evidenciasParteQueue, evidenciasLevantamientoQueue, evidenciasAlias } from '@/lib/dropboxServer';

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
  const acceso = await accesoEvidencias(req);
  if (!acceso) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { email, completo, persona } = acceso;
  const todo = verTodo(email);
  // Field staff and management get the whole app; a registry-only account gets «Calidad de fibra» and nothing else
  // (no queues, no Dropbox root: its files go up through one-use links the server issues).
  return NextResponse.json({
    email,
    completo,
    areas: completo ? ['captura', 'registros', 'levantamiento', ...(persona || todo ? ['calidad'] : [])] : ['calidad'],
    persona: persona ? { nombre: persona.nombre, cargo: persona.cargo, empresa: persona.empresa, roles: persona.roles, comunas: persona.comunas } : null,
    root: completo ? evidenciasRoot() : null,
    pilot: evidenciasPilotMode(),
    parteQueue: completo ? evidenciasParteQueue() : null,
    levantamientoQueue: completo ? evidenciasLevantamientoQueue() : null,
    verTodo: todo,
    verPorUbicar: todo,
  });
}
