const API_URL = process.env.ZABBIX_API_URL; // e.g. https://zabbix.visionaria.cl/api_jsonrpc.php
const API_TOKEN = process.env.ZABBIX_API_TOKEN;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let requestId = 0;

/**
 * Generic JSON-RPC call against the Zabbix API. Zabbix 5.4+ accepts the API token as a Bearer
 * header instead of the old per-call "auth" field, so no separate login step is needed here —
 * unlike Zoho, this token doesn't expire on its own (set without an expiry date in Zabbix).
 */
async function zabbixRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const url = requireEnv('ZABBIX_API_URL', API_URL);
  const token = requireEnv('ZABBIX_API_TOKEN', API_TOKEN);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json-rpc',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: ++requestId,
    }),
  });

  const text = await res.text();
  if (process.env.ZABBIX_DEBUG === '1') {
    console.log('zabbix request', { method, params, status: res.status, text: text.slice(0, 2000) });
  }

  let data: { result?: T; error?: { message: string; data?: string } };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Zabbix API returned non-JSON response (status ${res.status}): ${text.slice(0, 500)}`);
  }
  if (data.error) throw new Error(`Zabbix API error: ${data.error.message} — ${data.error.data ?? ''}`);
  return data.result as T;
}

export interface ZabbixHostGroup {
  groupid: string;
  name: string;
}

/** Resolves a client's Zabbix Host Group by exact name (stored per-Account in Zoho as cf_zabbix_host_group). */
export async function getHostGroupByName(name: string): Promise<ZabbixHostGroup | null> {
  const groups = await zabbixRequest<ZabbixHostGroup[]>('hostgroup.get', {
    output: ['groupid', 'name'],
    filter: { name: [name] },
  });
  return groups[0] ?? null;
}

export interface ZabbixHost {
  hostid: string;
  name: string;
  status: '0' | '1'; // 0 = monitored/enabled, 1 = disabled
}

/** Lists every host in a client's Host Group — the basis for the "sitios" / "cámaras" counts. */
export async function getHostsInGroup(groupId: string): Promise<ZabbixHost[]> {
  return zabbixRequest<ZabbixHost[]>('host.get', {
    output: ['hostid', 'name', 'status'],
    groupids: [groupId],
  });
}

export type ZabbixSeverity = '0' | '1' | '2' | '3' | '4' | '5'; // Not classified .. Disaster

export interface ZabbixProblem {
  eventid: string;
  name: string;
  severity: ZabbixSeverity;
  hostid: string;
  clock: string; // unix timestamp (seconds) as string
}

/** Active (unresolved) problems for a set of hosts — feeds "incidentes activos" and the semaphore. */
export async function getActiveProblems(hostIds: string[]): Promise<ZabbixProblem[]> {
  if (hostIds.length === 0) return [];
  const raw = await zabbixRequest<Record<string, unknown>[]>('problem.get', {
    output: ['eventid', 'name', 'severity', 'clock'],
    hostids: hostIds,
    selectHosts: ['hostid'],
    recent: false,
  });
  return raw.map(p => ({
    eventid: p.eventid as string,
    name: p.name as string,
    severity: p.severity as ZabbixSeverity,
    clock: p.clock as string,
    hostid: (p.hosts as { hostid: string }[])?.[0]?.hostid ?? '',
  }));
}
