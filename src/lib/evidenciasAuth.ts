import { NextRequest } from 'next/server';
import { decodeIntranetSession, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { hasProjectRole } from '@/lib/projects';
import { personaVigente, type Persona } from '@/lib/personas';

const PROYECTO = 'dpr-antofagasta';

function sessionEmail(req: NextRequest): string | null {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  return (cookie ? decodeIntranetSession(cookie) : null)?.email ?? null;
}

/**
 * Field staff and management (directors, Gestión y control, who always see everything). Only they get a Dropbox token:
 * the browser then uploads straight to Dropbox, which reaches the whole project folder.
 */
export function requireEvidenciasTech(req: NextRequest): string | null {
  const email = sessionEmail(req);
  if (!email || !(hasProjectRole(email, PROYECTO, 'tecnico') || hasProjectRole(email, PROYECTO, 'gestion'))) return null;
  return email;
}

export interface AccesoEvidencias {
  email: string;
  /** Terreno or Gestión y control: the whole app and a Dropbox token. */
  completo: boolean;
  /** «Personas del proyecto» entry (fiber quality roles and comunas), if any. */
  persona: Persona | null;
}

/**
 * Who may open the Evidencias app at all: staff with a field or management role, or someone the people registry lists
 * (an outside fiber contractor, an inspector). A registry-only person sees just «Calidad de fibra» and uploads through
 * one-use links the server issues for an exact path, never with a Dropbox token.
 */
export async function accesoEvidencias(req: NextRequest): Promise<AccesoEvidencias | null> {
  const email = sessionEmail(req);
  if (!email) return null;
  const completo = hasProjectRole(email, PROYECTO, 'tecnico') || hasProjectRole(email, PROYECTO, 'gestion');
  const persona = await personaVigente(PROYECTO, email);
  if (!completo && !persona) return null;
  return { email, completo, persona };
}
