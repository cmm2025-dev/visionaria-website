import { isIntranetAdmin, emailInAllowlists } from '@/lib/session';
import { personaVigente } from '@/lib/personas';

/**
 * Projects the Intranet groups its tools under. Each project gets its own mini-site at
 * /intranet/proyectos/<slug>, visible only to its members, with the modules each member's role allows.
 *
 * Membership lives in env vars (comma- or semicolon-separated emails), one list per role. A role may name
 * several vars so a project can keep a legacy list while moving to its own. Intranet admins get the
 * management role on every project; field work (which uploads under their name) still needs the list.
 *
 * To add a project: add an entry below and create its PROYECTO_<CODIGO>_<ROL> vars in Vercel.
 */

export type ProjectRole = 'tecnico' | 'gestion' | 'calidad' | 'personas';

export const ROLE_LABEL: Record<ProjectRole, string> = {
  tecnico: 'Terreno',
  gestion: 'Gestión y control',
  calidad: 'Calidad de fibra',
  personas: 'Personas del proyecto',
};

export interface ProjectModule {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Standalone page served by a route handler (opens with a full navigation, not client routing). */
  standalone?: boolean;
  roles: ProjectRole[];
}

export interface Project {
  slug: string;
  code: string;
  name: string;
  summary: string;
  details: string[];
  status: string;
  /** Env-var allowlists per role. «calidad» comes from the project's people registry (src/lib/personas.ts). */
  members: Partial<Record<ProjectRole, string[]>>;
  /** Who administers «Personas del proyecto» (besides the Intranet admins). */
  adminPersonas: string[];
  comunas: string[];
  modules: ProjectModule[];
}

export const PROJECTS: Project[] = [
  {
    slug: 'dpr-antofagasta',
    code: 'DPR-ANF',
    name: 'DPR Antofagasta',
    summary: 'Cámaras y pórticos · 2026',
    details: ['Licitación 1604-4-LR25', 'Antofagasta · Calama · Tocopilla'],
    status: 'En ejecución',
    members: {
      tecnico: ['PROYECTO_DPR_ANF_TERRENO', 'EVIDENCIAS_TECH_EMAILS'],
      gestion: ['PROYECTO_DPR_ANF_GESTION', 'INTRANET_PANEL_EMAILS'],
    },
    adminPersonas: ['iandaur@visionaria.cl', 'rmartinez@visionaria.cl'],
    comunas: ['Antofagasta', 'Calama', 'Tocopilla'],
    modules: [
      {
        id: 'evidencias',
        title: 'Evidencias de terreno',
        description: 'Fotos, protocolo de instalación, levantamiento DEC-020 y registro del parte diario.',
        href: '/api/evidencias/app',
        standalone: true,
        roles: ['tecnico', 'gestion', 'calidad'],
      },
      {
        id: 'personas',
        title: 'Personas del proyecto',
        description: 'Cuentas y roles de quienes trabajan en el proyecto, incluido el contratista de fibra, con su vigencia.',
        href: '/intranet/proyectos/dpr-antofagasta/personas',
        roles: ['personas'],
      },
      {
        id: 'panel',
        title: 'Panel ejecutivo · Parte diario',
        description: 'Avance por etapa, novedades y filas por corregir, en tiempo real.',
        href: '/intranet/proyectos/dpr-antofagasta/panel',
        roles: ['gestion'],
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find(p => p.slug === slug);
}

export function projectRoles(email: string, project: Project): ProjectRole[] {
  const admin = isIntranetAdmin(email);
  const roles = (Object.entries(project.members) as [ProjectRole, string[]][])
    .filter(([role, vars]) => (admin && role === 'gestion') || emailInAllowlists(email, vars))
    .map(([role]) => role);
  if (admin || project.adminPersonas.includes(email.trim().toLowerCase())) roles.push('personas');
  return roles;
}

/** The env-var roles plus «calidad» when the people registry lists the person, active and in date. */
export async function projectRolesAsync(email: string, project: Project): Promise<ProjectRole[]> {
  const roles = projectRoles(email, project);
  if (await personaVigente(project.slug, email)) roles.push('calidad');
  return roles;
}

export function hasProjectRole(email: string, slug: string, role: ProjectRole): boolean {
  const project = getProject(slug);
  return !!project && projectRoles(email, project).includes(role);
}

/** What the Intranet shows a user: the projects they belong to and, inside each, the modules their roles open. */
export interface ProjectView {
  slug: string;
  code: string;
  name: string;
  summary: string;
  details: string[];
  status: string;
  roles: { id: ProjectRole; label: string }[];
  modules: Omit<ProjectModule, 'roles'>[];
}

export async function projectsFor(email: string, locale: string): Promise<ProjectView[]> {
  const vistas = await Promise.all(PROJECTS.map(async p => ({ p, roles: await projectRolesAsync(email, p) })));
  return vistas.flatMap(({ p, roles }) => {
    if (!roles.length) return [];
    return [{
      slug: p.slug,
      code: p.code,
      name: p.name,
      summary: p.summary,
      details: p.details,
      status: p.status,
      roles: roles.map(id => ({ id, label: ROLE_LABEL[id] })),
      modules: p.modules
        .filter(m => m.roles.some(r => roles.includes(r)))
        .map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          standalone: m.standalone,
          href: m.standalone ? m.href : `/${locale}${m.href}`,
        })),
    }];
  });
}
