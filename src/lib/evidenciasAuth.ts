import { NextRequest } from 'next/server';
import { decodeIntranetSession, INTRANET_SESSION_COOKIE } from '@/lib/session';
import { hasProjectRole } from '@/lib/projects';

/** The Evidencias app belongs to DPR Antofagasta: it needs an Intranet session and that project's field role. */
export function requireEvidenciasTech(req: NextRequest): string | null {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  const session = cookie ? decodeIntranetSession(cookie) : null;
  if (!session || !hasProjectRole(session.email, 'dpr-antofagasta', 'tecnico')) return null;
  return session.email;
}
