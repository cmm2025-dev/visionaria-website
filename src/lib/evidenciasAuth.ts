import { NextRequest } from 'next/server';
import { decodeIntranetSession, isEvidenciasTech, INTRANET_SESSION_COOKIE } from '@/lib/session';

/** Requires both a valid Intranet session AND membership in the Evidencias technician allowlist. */
export function requireEvidenciasTech(req: NextRequest): string | null {
  const cookie = req.cookies.get(INTRANET_SESSION_COOKIE)?.value;
  const session = cookie ? decodeIntranetSession(cookie) : null;
  if (!session || !isEvidenciasTech(session.email)) return null;
  return session.email;
}
