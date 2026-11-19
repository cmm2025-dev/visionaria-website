import { put, get } from '@vercel/blob';

/**
 * «Personas del proyecto»: who works in a project beyond the staff env-var lists, with the minimum personal data the
 * contract allows (name, title, email, company, role, comuna) and how long the access lasts. It is how an external
 * fiber contractor gets an Intranet account: the Intranet accepts a non-staff email only while it is listed here,
 * active and within its date. It lives in the private Blob store, one JSON per project, edited from the project's
 * «Personas del proyecto» page by the people the project names as its administrators.
 */

export type RolPersona = 'contratista_fo' | 'inspector_fo' | 'oficina';

export const ROL_PERSONA_LABEL: Record<RolPersona, string> = {
  contratista_fo: 'Contratista de fibra (registra la ejecución)',
  inspector_fo: 'Inspector de fibra (registra la inspección)',
  oficina: 'Oficina (Administrador de Contrato o Ingeniería)',
};

export interface Persona {
  email: string;
  nombre: string;
  cargo: string;
  empresa: string;
  roles: RolPersona[];
  comunas: string[];
  /** Last day the access is valid (YYYY-MM-DD, Chile); null = no end date. */
  vigenteHasta: string | null;
  activo: boolean;
}

const EMPRESA = 'Sistemas de Seguridad y Tecnología SpA (Sistesa SpA)';
/** What the project starts with until someone saves the list (decision of 06-11-2026: the JP inspects for now). */
const SEMILLA: Record<string, Persona[]> = {
  'dpr-antofagasta': [{
    email: 'jp_anf@visionaria.cl', nombre: 'JP técnico', cargo: 'Jefe de proyecto técnico', empresa: EMPRESA,
    roles: ['inspector_fo'], comunas: ['Antofagasta', 'Calama', 'Tocopilla'], vigenteHasta: null, activo: true,
  }],
};

const ruta = (slug: string) => `intranet/proyectos/${slug}/personas.json`;

export async function getPersonas(slug: string): Promise<Persona[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return SEMILLA[slug] ?? [];
  try {
    const res = await get(ruta(slug), { access: 'private', useCache: false });
    if (res?.statusCode !== 200) return SEMILLA[slug] ?? [];
    const data = await new Response(res.stream).json();
    return Array.isArray(data) ? data : SEMILLA[slug] ?? [];
  } catch {
    return SEMILLA[slug] ?? [];
  }
}

export async function savePersonas(slug: string, personas: Persona[]): Promise<void> {
  await put(ruta(slug), JSON.stringify(personas), { access: 'private', contentType: 'application/json', allowOverwrite: true });
}

export function hoyChile(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}

export function estaVigente(p: Persona, hoy = hoyChile()): boolean {
  return p.activo && p.roles.length > 0 && (!p.vigenteHasta || hoy <= p.vigenteHasta);
}

export async function personaVigente(slug: string, email: string): Promise<Persona | null> {
  const target = email.trim().toLowerCase();
  const p = (await getPersonas(slug)).find(x => x.email === target);
  return p && estaVigente(p) ? p : null;
}

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Checks and normalizes a list sent from the page; the message says what is wrong, in Spanish, for the page. */
export function validarPersonas(input: unknown, comunas: string[]): { personas: Persona[] } | { error: string } {
  if (!Array.isArray(input)) return { error: 'La lista no es válida.' };
  const vistos = new Set<string>();
  const out: Persona[] = [];
  for (const [i, raw] of input.entries()) {
    const x = raw as Partial<Persona>;
    const email = String(x.email ?? '').trim().toLowerCase();
    const fila = `Fila ${i + 1}`;
    if (!EMAIL.test(email) || email.length > 254) return { error: `${fila}: el correo no es válido.` };
    if (vistos.has(email)) return { error: `${fila}: ${email} está repetido.` };
    vistos.add(email);
    const nombre = String(x.nombre ?? '').trim(), cargo = String(x.cargo ?? '').trim(), empresa = String(x.empresa ?? '').trim();
    if (!nombre || !cargo || !empresa) return { error: `${fila}: faltan nombre, cargo o empresa.` };
    if ([nombre, cargo, empresa].some(s => s.length > 120)) return { error: `${fila}: un texto es demasiado largo.` };
    const roles = (Array.isArray(x.roles) ? x.roles : []).filter((r): r is RolPersona => r in ROL_PERSONA_LABEL);
    const com = (Array.isArray(x.comunas) ? x.comunas : []).filter(c => comunas.includes(String(c))).map(String);
    if (!roles.length) return { error: `${fila}: elige al menos un rol.` };
    if (!com.length) return { error: `${fila}: elige al menos una comuna.` };
    const vigenteHasta = x.vigenteHasta ? String(x.vigenteHasta) : null;
    if (vigenteHasta && !/^\d{4}-\d{2}-\d{2}$/.test(vigenteHasta)) return { error: `${fila}: la fecha de término no es válida.` };
    out.push({ email, nombre, cargo, empresa, roles, comunas: com, vigenteHasta, activo: x.activo !== false });
  }
  return { personas: out };
}
