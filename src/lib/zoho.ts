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

  return { id: first.id, accountId: first.accountId, accountName, email: first.email };
}

export interface ZohoTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  dueDate: string | null;
  isOverdue: boolean;
}

/** Fetches open tickets for the given Account (municipio/cliente), using the service token. */
export async function getAccountTickets(serviceToken: string, accountId: string): Promise<ZohoTicket[]> {
  const orgId = requireEnv('ZOHO_ORG_ID');
  const params = new URLSearchParams({
    accountId,
    limit: '50',
    sortBy: 'modifiedTime',
  });
  const res = await fetch(`${API_BASE}/tickets?${params.toString()}`, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  const data = await res.json();
  if (process.env.ZOHO_DEBUG === '1') {
    console.log('zoho tickets', { status: res.status, accountId, data: JSON.stringify(data).slice(0, 2000) });
  }
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .filter((t: Record<string, unknown>) => t.status !== 'Closed' && t.status !== 'Resolved')
    .map((t: Record<string, unknown>) => ({
      id: t.id as string,
      ticketNumber: t.ticketNumber as string,
      subject: t.subject as string,
      status: t.status as string,
      priority: (t.priority as string) ?? 'Medium',
      dueDate: (t.dueDate as string) ?? null,
      isOverdue: Boolean(t.isOverdue),
    }));
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
  const highPriorityCount = tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length;
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
