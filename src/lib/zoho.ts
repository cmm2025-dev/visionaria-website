const ACCOUNTS_BASE = 'https://accounts.zoho.com';
const API_BASE = 'https://desk.zoho.com/api/v1';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/** Exchanges an OAuth authorization code (end-user login flow) for a short-lived access token. */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: requireEnv('ZOHO_CLIENT_ID'),
    client_secret: requireEnv('ZOHO_CLIENT_SECRET'),
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${ACCOUNTS_BASE}/oauth/v2/token`, { method: 'POST', body: params });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Zoho token exchange failed: ${JSON.stringify(data)}`);
  return data;
}

/** Resolves the display email of the account that just completed the Zoho login flow. */
export async function getZohoUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${ACCOUNTS_BASE}/oauth/user/info`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || !data.Email) throw new Error(`Zoho user info failed: ${JSON.stringify(data)}`);
  return data.Email as string;
}

let cachedServiceToken: { token: string; expiresAt: number } | null = null;

/**
 * Access token for the backend service account used to query Desk data server-side.
 * Minted once from ZOHO_SERVICE_REFRESH_TOKEN (see /api/admin/zoho-service-auth), refreshed as needed.
 * Never derived from an end user's own login — end users only prove *who* they are, this token decides *what they may see*.
 */
export async function getServiceAccessToken(): Promise<string> {
  if (cachedServiceToken && cachedServiceToken.expiresAt > Date.now()) return cachedServiceToken.token;
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: requireEnv('ZOHO_CLIENT_ID'),
    client_secret: requireEnv('ZOHO_CLIENT_SECRET'),
    refresh_token: requireEnv('ZOHO_SERVICE_REFRESH_TOKEN'),
  });
  const res = await fetch(`${ACCOUNTS_BASE}/oauth/v2/token`, { method: 'POST', body: params });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`Zoho service token refresh failed: ${JSON.stringify(data)}`);
  cachedServiceToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

interface ZohoContact {
  id: string;
  accountId?: string;
  accountName?: string;
  email: string;
  /** Only genuine site operators may open tickets — regional/executive viewers typically may not. */
  canCreateTickets: boolean;
  /** Extra Account IDs a regional client can see, beyond their own primary account. */
  additionalAccountIds: string[];
  /** Visionaria staff flag: see every client's data, not just their own account(s). */
  fullAccess: boolean;
}

/** Looks up the Desk Contact record for a verified login email, using the service token. */
export async function findContactByEmail(serviceToken: string, email: string): Promise<ZohoContact | null> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const url = `${API_BASE}/contacts/search?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho contacts/search', { status: res.status, email, data: JSON.stringify(data).slice(0, 2000) });
  }
  const first = data?.data?.[0];
  if (!first) return null;

  let accountName: string | undefined;
  if (first.accountId) {
    const accRes = await fetch(`${API_BASE}/accounts/${first.accountId}`, {
      headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
    });
    if (accRes.ok) {
      const accData = await accRes.json();
      accountName = accData?.accountName;
      if (process.env.ZOHO_DEBUG === '1') {
        console.log('zoho accounts/get', { status: accRes.status, data: JSON.stringify(accData).slice(0, 500) });
      }
    }
  }

  const cf = (first.cf as Record<string, unknown>) ?? {};
  const additionalRaw = String(cf.cf_accounts_adicionales ?? '');
  const additionalAccountIds = additionalRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    id: first.id,
    accountId: first.accountId,
    accountName,
    email: first.email,
    canCreateTickets: !cf.cf_solo_visualizacion,
    additionalAccountIds,
    fullAccess: Boolean(cf.cf_acceso_total_visionaria),
  };
}

/**
 * Looks up the Desk Contact record for an inbound WhatsApp sender's phone number, using the
 * service token. Mirrors findContactByEmail — same nested-`cf` field reading, same "first match
 * wins" behavior. Numbers should be compared in E.164 form; Zoho stores them however the agent
 * typed them at Contact-creation time, so this may need loosening (last-N-digits match) once we
 * see real phone values coming back from the channel.
 */
export async function findContactByPhone(serviceToken: string, phone: string): Promise<ZohoContact | null> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const url = `${API_BASE}/contacts/search?phone=${encodeURIComponent(phone)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho contacts/search (phone)', { status: res.status, phone, data: JSON.stringify(data).slice(0, 2000) });
  }
  const first = data?.data?.[0];
  if (!first) return null;

  let accountName: string | undefined;
  if (first.accountId) {
    const accRes = await fetch(`${API_BASE}/accounts/${first.accountId}`, {
      headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
    });
    if (accRes.ok) {
      const accData = await accRes.json();
      accountName = accData?.accountName;
    }
  }

  const cf = (first.cf as Record<string, unknown>) ?? {};
  const additionalRaw = String(cf.cf_accounts_adicionales ?? '');
  const additionalAccountIds = additionalRaw.split(',').map(s => s.trim()).filter(Boolean);

  return {
    id: first.id,
    accountId: first.accountId,
    accountName,
    email: first.email,
    canCreateTickets: !cf.cf_solo_visualizacion,
    additionalAccountIds,
    fullAccess: Boolean(cf.cf_acceso_total_visionaria),
  };
}

/** Lists every Account (used for the "full access" Visionaria-staff view). */
export async function getAllAccounts(serviceToken: string): Promise<{ id: string; name: string }[]> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const res = await fetch(`${API_BASE}/accounts?from=0&limit=100`, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  const data = await res.json();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho accounts list', { status: res.status, data: JSON.stringify(data).slice(0, 2000) });
  }
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map((a: Record<string, unknown>) => ({ id: a.id as string, name: (a.accountName as string) ?? a.id as string }));
}

/** Resolves the full list of {id, name} Accounts a contact is allowed to see. */
export async function resolveAccessibleAccounts(
  serviceToken: string,
  contact: ZohoContact
): Promise<{ id: string; name: string }[]> {
  if (contact.fullAccess) return getAllAccounts(serviceToken);

  const orgId = requireEnv('ZOHO_ORG_ID');
  const ids = [contact.accountId, ...contact.additionalAccountIds].filter(Boolean) as string[];
  const uniqueIds = Array.from(new Set(ids));

  const accounts = await Promise.all(
    uniqueIds.map(async id => {
      if (id === contact.accountId && contact.accountName) return { id, name: contact.accountName };
      const res = await fetch(`${API_BASE}/accounts/${id}`, { headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId } });
      if (!res.ok) return null;
      const data = await res.json();
      return { id, name: (data?.accountName as string) ?? id };
    })
  );

  return accounts.filter((a): a is { id: string; name: string } => a !== null);
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface ZohoTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: Priority;
  dueDate: string | null;
  isOverdue: boolean;
}

/**
 * Zoho returns priority as a display label in the org's own language (e.g. "Medio" for a
 * Spanish-language org, "Medium" in English) -- normalize to a fixed set of keys so the
 * semaphore logic and UI translation lookups never depend on the org's locale.
 */
function normalizePriority(raw: unknown): Priority {
  const value = String(raw ?? '').trim().toLowerCase();
  if (['high', 'alta', 'alto'].includes(value)) return 'high';
  if (['urgent', 'urgente'].includes(value)) return 'urgent';
  if (['low', 'baja', 'bajo'].includes(value)) return 'low';
  return 'medium';
}

/** Fetches open tickets for the given Account (municipio/cliente), using the service token. */
export async function getAccountTickets(serviceToken: string, accountId: string): Promise<ZohoTicket[]> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const params = new URLSearchParams({
    limit: '50',
    sortBy: 'modifiedTime',
  });
  const res = await fetch(`${API_BASE}/accounts/${accountId}/tickets?${params.toString()}`, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  const text = await res.text();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho tickets', { status: res.status, accountId, text: text.slice(0, 2000) });
  }
  let data: Record<string, unknown>;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return [];
  }
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    // closedTime is a locale-independent field; ticket "status" itself is a localized label
    // (e.g. "Cerrado" in a Spanish org), so it can't be compared against English constants.
    .filter((t: Record<string, unknown>) => !t.closedTime)
    .map((t: Record<string, unknown>) => ({
      id: t.id as string,
      ticketNumber: t.ticketNumber as string,
      subject: t.subject as string,
      status: t.status as string,
      priority: normalizePriority(t.priority),
      dueDate: (t.dueDate as string) ?? null,
      isOverdue: Boolean(t.isOverdue),
    }));
}

export interface ClientDocument {
  id: string;
  name: string;
  url: string | null;
  system: string | null;
}

const DOCS_MODULE = 'cm_repositorio_documental';

/**
 * Fetches the client-specific technical documents from the "Repositorio Documental" custom
 * module. The plain list endpoint only returns id + layout (no custom field data), so each
 * record's full detail has to be fetched individually before it can be matched against AccountId.
 */
export async function getClientDocuments(serviceToken: string, accountId: string): Promise<ClientDocument[]> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const authHeaders = { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId };

  const listRes = await fetch(`${API_BASE}/${DOCS_MODULE}?from=0&limit=100`, { headers: authHeaders });
  const listData = await listRes.json();
  const ids = (Array.isArray(listData?.data) ? listData.data : []).map((d: Record<string, unknown>) => d.id as string);

  const records = await Promise.all(
    ids.map(async (id: string) => {
      const res = await fetch(`${API_BASE}/${DOCS_MODULE}/${id}`, { headers: authHeaders });
      return res.json();
    })
  );

  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho documents', { listStatus: listRes.status, accountId, ids, records: JSON.stringify(records).slice(0, 2000) });
  }

  return records
    .filter((d: Record<string, unknown>) => (d.cf as Record<string, unknown> | undefined)?.cf_account_id === accountId)
    .map((d: Record<string, unknown>) => {
      const cf = (d.cf as Record<string, unknown>) ?? {};
      return {
        id: d.id as string,
        name: (d.name as string) ?? 'Documento',
        url: (cf.cf_enlace as string) ?? null,
        system: (cf.cf_sistema as string) ?? null,
      };
    });
}

const INVENTORY_MODULE = 'cm_inventario_de_activos';

export interface InventoryItem {
  assetType: string;
  totalCount: number;
}

/** Fetches the client's installed-asset inventory (cameras, PCs, servers, ...) for severity calculations. */
export async function getClientInventory(serviceToken: string, accountId: string): Promise<InventoryItem[]> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const authHeaders = { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId };

  const listRes = await fetch(`${API_BASE}/${INVENTORY_MODULE}?from=0&limit=100`, { headers: authHeaders });
  const listData = await listRes.json();
  const ids = (Array.isArray(listData?.data) ? listData.data : []).map((d: Record<string, unknown>) => d.id as string);

  const records = await Promise.all(
    ids.map(async (id: string) => {
      const res = await fetch(`${API_BASE}/${INVENTORY_MODULE}/${id}`, { headers: authHeaders });
      return res.json();
    })
  );

  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho inventory', { listStatus: listRes.status, accountId, ids, records: JSON.stringify(records).slice(0, 2000) });
  }

  return records
    .filter((d: Record<string, unknown>) => (d.cf as Record<string, unknown> | undefined)?.cf_account_id === accountId)
    .map((d: Record<string, unknown>) => {
      const cf = (d.cf as Record<string, unknown>) ?? {};
      return {
        assetType: (cf.cf_tipo_activo as string) ?? '',
        totalCount: Number(cf.cf_cantidad_total ?? 0),
      };
    });
}

export interface NewTicketInput {
  contactId: string;
  subject: string;
  description: string;
  tipoFalla: string;
  camarasAfectadas: number | null;
  fallaGlobal: boolean;
  ubicacion: string;
  checklist: {
    energiaNormal: boolean;
    sinSiniestro: boolean;
    anomaliaPersiste: boolean;
    reinicioIntentado: boolean;
    accesoInternet: boolean;
  };
  priority: 'Low' | 'Medium' | 'High';
}

/** Creates a real Zoho Desk ticket on behalf of an authenticated contact, via the service account. */
export async function createTicket(serviceToken: string, input: NewTicketInput): Promise<{ id: string; ticketNumber: string }> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const departmentId = requireEnv('ZOHO_POSTVENTA_DEPARTMENT_ID');

  const body = {
    subject: input.subject,
    description: input.description,
    departmentId,
    contactId: input.contactId,
    priority: input.priority,
    cf: {
      cf_tipo_de_falla: input.tipoFalla,
      cf_cantidad_de_puntos_afectados: input.camarasAfectadas,
      cf_falla_global_del_sistema: input.fallaGlobal,
      cf_ubiccion_o_camara_especifica: input.ubicacion,
      cf_energia_electrica_verificada_y_en_estado_normal: input.checklist.energiaNormal,
      cf_sin_evidencia_de_siniestro: input.checklist.sinSiniestro,
      cf_anomalia_persiste_sobre_1h: input.checklist.anomaliaPersiste,
      cf_se_reinicio_el_equipo: input.checklist.reinicioIntentado,
      cf_hay_acceso_a_internet: input.checklist.accesoInternet,
    },
  };

  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho create ticket', { status: res.status, body, text: text.slice(0, 2000) });
  }
  let data: Record<string, unknown>;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Zoho create ticket returned non-JSON response (status ${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok) throw new Error(`Zoho create ticket failed: ${JSON.stringify(data)}`);
  return { id: data.id as string, ticketNumber: data.ticketNumber as string };
}

/** Maps fault type + affected-asset ratio to an automatic priority — the client never picks this directly. */
export function computeTicketPriority(
  tipoFalla: string,
  camarasAfectadas: number | null,
  fallaGlobal: boolean,
  inventory: InventoryItem[]
): 'Low' | 'Medium' | 'High' {
  if (fallaGlobal) return 'High';

  if (tipoFalla === 'Camaras sin Señal' && camarasAfectadas) {
    const totalCameras = inventory.find(i => i.assetType.toLowerCase().includes('cámara') || i.assetType.toLowerCase().includes('camara'))?.totalCount ?? 0;
    if (totalCameras > 0) {
      const pct = (camarasAfectadas / totalCameras) * 100;
      if (pct > 15) return 'High';
      return 'Medium';
    }
  }

  if (tipoFalla === 'Falla de Servidores -VMS') return 'High';
  if (tipoFalla === 'Falla de Sistema de Grabacion' || tipoFalla === 'Falla de Monitor VideoWall') return 'Medium';
  if (tipoFalla === 'Falla en Estacion de Operador') return 'Medium';
  return 'Low';
}

export type Semaphore = 'green' | 'yellow' | 'red';

export interface SupportSnapshot {
  clientName: string;
  semaphore: Semaphore;
  activeCount: number;
  highPriorityCount: number;
  nearSlaCount: number;
  overdueCount: number;
  updatedAt: string;
  tickets: ZohoTicket[];
}

const NEAR_SLA_WINDOW_MS = 1000 * 60 * 60 * 4; // 4h

/** Derives the traffic-light status shown on the client dashboard from a set of open tickets. */
export function computeSnapshot(clientName: string, tickets: ZohoTicket[]): SupportSnapshot {
  const now = Date.now();
  const overdueCount = tickets.filter(t => t.isOverdue).length;
  const highPriorityCount = tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
  const nearSlaCount = tickets.filter(t => {
    if (t.isOverdue || !t.dueDate) return false;
    const due = new Date(t.dueDate).getTime();
    return due - now <= NEAR_SLA_WINDOW_MS;
  }).length;

  let semaphore: Semaphore = 'green';
  if (overdueCount > 0 || highPriorityCount > 0) semaphore = 'red';
  else if (tickets.length > 0) semaphore = 'yellow';

  return {
    clientName,
    semaphore,
    activeCount: tickets.length,
    highPriorityCount,
    nearSlaCount,
    overdueCount,
    updatedAt: new Date().toISOString(),
    tickets,
  };
}

// ---------------------------------------------------------------------------
// WhatsApp channel support — reusable logic only. Not yet wired to a live
// webhook: the WhatsApp Business number is still pending Meta/Zoho validation.
// Once a channel is chosen (Zoho Desk's native WhatsApp channel, or the Meta
// Cloud API directly), a webhook route calls these three functions in order:
// findContactByPhone -> buildAgentContextSummary (posted for the agent) and
// classifyInboundSeverity -> maybeAutoCreateTicket (only for high-severity
// messages; everything else stays a plain conversation for the agent to
// triage manually).
// ---------------------------------------------------------------------------

/**
 * Plain-text context block meant to be attached to the inbound WhatsApp conversation (e.g. as an
 * internal note) so the technical agent sees, at a glance, what this contact has open before
 * replying — instead of having to look it up in Desk by hand.
 */
export async function buildAgentContextSummary(serviceToken: string, contact: ZohoContact): Promise<string> {
  const accounts = await resolveAccessibleAccounts(serviceToken, contact);
  if (accounts.length === 0) return `Contacto ${contact.email} sin cuenta asociada en Zoho Desk.`;

  const snapshots = await Promise.all(
    accounts.map(async account => {
      const tickets = await getAccountTickets(serviceToken, account.id);
      return computeSnapshot(account.name, tickets);
    })
  );

  const lines = snapshots.map(s => {
    const bits = [`${s.activeCount} activo(s)`];
    if (s.highPriorityCount > 0) bits.push(`${s.highPriorityCount} de alta prioridad`);
    if (s.overdueCount > 0) bits.push(`${s.overdueCount} vencido(s) de SLA`);
    return `• ${s.clientName} [${s.semaphore.toUpperCase()}]: ${bits.join(', ')}`;
  });

  return [`Resumen de soporte — ${contact.email}`, ...lines].join('\n');
}

/**
 * Keyword heuristic for freeform inbound WhatsApp text — mirrors the "falla global" / high-impact
 * cases from computeTicketPriority, since a chat message has no structured tipoFalla/camarasAfectadas
 * fields to work with. Deliberately conservative: false negatives just mean the agent triages the
 * message by hand, which is the safe default; false positives create noise tickets, so keep this list
 * tight rather than broad.
 */
const HIGH_SEVERITY_KEYWORDS = [
  'sistema caido', 'sistema caído', 'todo caido', 'todo caído',
  'sin señal total', 'sin senal total', 'todas las camaras', 'todas las cámaras',
  'incendio', 'inundacion', 'inundación', 'robo', 'emergencia', 'siniestro',
  'no hay video', 'perdimos todo', 'servidor caido', 'servidor caído',
];

export function classifyInboundSeverity(message: string): 'high' | 'normal' {
  const normalized = message.toLowerCase();
  return HIGH_SEVERITY_KEYWORDS.some(k => normalized.includes(k)) ? 'high' : 'normal';
}

/**
 * Creates a ticket automatically only for high-severity inbound messages from a contact authorized
 * to open tickets (canCreateTickets); everything else — low/medium severity, or a contact who's
 * view-only — is left as a plain conversation for the agent to escalate manually if needed.
 */
export async function maybeAutoCreateTicket(
  serviceToken: string,
  contact: ZohoContact,
  message: string
): Promise<{ id: string; ticketNumber: string } | null> {
  if (!contact.canCreateTickets) return null;
  if (classifyInboundSeverity(message) !== 'high') return null;

  return createTicket(serviceToken, {
    contactId: contact.id,
    subject: `[WhatsApp] Reporte de alta gravedad — ${contact.accountName ?? contact.email}`,
    description: message,
    tipoFalla: 'Falla de Servidores -VMS',
    camarasAfectadas: null,
    fallaGlobal: true,
    ubicacion: '',
    checklist: {
      energiaNormal: false,
      sinSiniestro: false,
      anomaliaPersiste: false,
      reinicioIntentado: false,
      accesoInternet: false,
    },
    priority: 'High',
  });
}
