import { put, head } from '@vercel/blob';

export interface IntranetLink {
  id: string;
  label: string;
  url: string;
}

const BLOB_PATH = 'intranet/links.json';

const DEFAULT_LINKS: IntranetLink[] = [
  { id: 'default-1', label: 'Manuales y procedimientos internos', url: '#' },
  { id: 'default-2', label: 'Directorio de contactos del equipo', url: '#' },
  { id: 'default-3', label: 'Políticas y documentos de RR.HH.', url: '#' },
];

/**
 * Content lives in a single JSON blob rather than the codebase -- editors change it through
 * the /intranet/admin form and never touch git, Vercel, or any deploy.
 */
export async function getIntranetLinks(): Promise<IntranetLink[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return DEFAULT_LINKS;
  try {
    const info = await head(BLOB_PATH);
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_LINKS;
    const data = await res.json();
    return Array.isArray(data) ? data : DEFAULT_LINKS;
  } catch {
    // No blob written yet, or storage not reachable -- fall back to the starter set.
    return DEFAULT_LINKS;
  }
}

export async function saveIntranetLinks(links: IntranetLink[]): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(links), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  });
}
