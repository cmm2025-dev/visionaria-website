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

/** Lists every Host Group — used once during setup to read the real names to fill into cf_zabbix_nombre. */
export async function getAllHostGroups(): Promise<ZabbixHostGroup[]> {
  return zabbixRequest<ZabbixHostGroup[]>('hostgroup.get', {
    output: ['groupid', 'name'],
  });
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
  tags?: { tag: string; value: string }[];
  parentTemplates?: { templateid: string; name: string }[];
}

/**
 * Lists every host in a client's Host Group — the basis for the "sitios" / "cámaras" counts.
 * Also pulls tags + parent templates: since host *names* follow no consistent convention across
 * clients/technicians, those are the only reliable way to tell a camera apart from a server,
 * switch, or P2P link (still being confirmed against real data before this is relied on).
 */
export async function getHostsInGroup(groupId: string): Promise<ZabbixHost[]> {
  const raw = await zabbixRequest<Record<string, unknown>[]>('host.get', {
    output: ['hostid', 'name', 'status'],
    selectTags: 'extend',
    selectParentTemplates: ['templateid', 'name'],
    groupids: [groupId],
  });
  return raw.map(h => ({
    hostid: h.hostid as string,
    name: h.name as string,
    status: h.status as '0' | '1',
    tags: h.tags as { tag: string; value: string }[] | undefined,
    parentTemplates: h.parentTemplates as { templateid: string; name: string }[] | undefined,
  }));
}

export type ZabbixSeverity = '0' | '1' | '2' | '3' | '4' | '5'; // Not classified .. Disaster

export interface ZabbixProblem {
  eventid: string;
  name: string;
  severity: ZabbixSeverity;
  hostid: string;
  clock: string; // unix timestamp (seconds) as string
}

/**
 * Active (unresolved) problems for a set of hosts — feeds "incidentes activos" and the
 * per-camera online/offline check.
 *
 * Only severities >= Average (3) by default — NOT every unresolved problem. Real data pulled
 * from this API showed problems left unresolved since 2021 (years of low-severity noise like
 * "RSS Balance" or link-speed-change notices nobody ever acknowledged). Counting all of those
 * as "incidentes activos" would make the indicator meaningless. Zabbix's own Problems view
 * defaults to a "Minimum severity: High" filter for the same reason — this mirrors that, one
 * notch more permissive to still catch prolonged real outages.
 */
export async function getActiveProblems(hostIds: string[]): Promise<ZabbixProblem[]> {
  if (hostIds.length === 0) return [];
  const raw = await zabbixRequest<Record<string, unknown>[]>('problem.get', {
    output: ['eventid', 'name', 'severity', 'clock', 'objectid'],
    hostids: hostIds,
    severities: ['3', '4', '5'],
    recent: false,
  });

  // problem.get's selectHosts came back empty on every row against this Zabbix instance
  // (confirmed against real data — not a fluke). objectid is the triggerid that raised the
  // problem, and trigger.get reliably resolves that to its host, so go through that instead.
  const triggerIds = Array.from(new Set(raw.map(p => p.objectid as string).filter(Boolean)));
  const triggerHostMap = new Map<string, string>();
  if (triggerIds.length > 0) {
    const triggers = await zabbixRequest<Record<string, unknown>[]>('trigger.get', {
      output: ['triggerid'],
      triggerids: triggerIds,
      selectHosts: ['hostid'],
    });
    for (const t of triggers) {
      const hostid = (t.hosts as { hostid: string }[])?.[0]?.hostid;
      if (hostid) triggerHostMap.set(t.triggerid as string, hostid);
    }
  }

  return raw.map(p => ({
    eventid: p.eventid as string,
    name: p.name as string,
    severity: p.severity as ZabbixSeverity,
    clock: p.clock as string,
    hostid: triggerHostMap.get(p.objectid as string) ?? '',
  }));
}

// ---------------------------------------------------------------------------
// Host classification — BEST-EFFORT HEURISTIC, not a guaranteed rule.
//
// Zabbix hosts have no tags or templates set that indicate device type (confirmed against real
// data: parentTemplates is empty on every host, and the few tags present just repeat the client
// name). The only signal available today is the free-text host name, which technicians typed by
// hand with no enforced convention — this works for clients that happen to follow the "CN_### PTZ"
// pattern (confirmed for Puente Alto) and may need per-client tuning for others.
//
// Follow-up (tracked separately, not blocking this MVP): write technicians a standardization
// guide — e.g. a "Cliente" host tag plus a "Tipo" tag (camera/server/switch/link) — so this
// classification can move from heuristic to authoritative.
// ---------------------------------------------------------------------------

export type DeviceKind = 'camera' | 'infra';

/** Guesses a host's device type from its name. See the caveats above before trusting this blindly. */
export function classifyHostKind(name: string): DeviceKind {
  return /\bPTZ\b/i.test(name) ? 'camera' : 'infra';
}

/** Extracts the site identifier (e.g. "CN_110") a host belongs to, if its name follows that pattern. */
export function extractSiteId(name: string): string | null {
  const match = name.match(/\bCN_\d+\b/i);
  return match ? match[0].toUpperCase() : null;
}

export interface AccountZabbixSnapshot {
  clientName: string;
  estadoGeneral: 'OPERATIVO' | 'CON_INCIDENCIAS';
  camarasOnline: number;
  camarasTotal: number;
  sitiosOnline: number;
  sitiosTotal: number;
  incidentesActivos: number;
  /** Simple proxy: % of cameras currently reachable. Not a true rolling 30-day SLA calculation. */
  disponibilidadPct: number;
}

/**
 * Computes the 6 MVP dashboard indicators for one client's Host Group. "Grabación" (storage %)
 * is deliberately left out for now — it needs a real item key (disk usage per archiver host)
 * that hasn't been identified yet.
 */
export async function computeAccountSnapshot(clientName: string, groupId: string): Promise<AccountZabbixSnapshot> {
  const hosts = await getHostsInGroup(groupId);
  const cameras = hosts.filter(h => classifyHostKind(h.name) === 'camera');
  const problems = await getActiveProblems(hosts.map(h => h.hostid));
  const hostIdsWithProblems = new Set(problems.map(p => p.hostid));

  // A camera's own PTZ host rarely carries the problem itself — connectivity issues land on its
  // paired HSU radio host instead (confirmed against real data: 131 active problems, 0 of them
  // on a PTZ hostid). So a camera counts as down if its own host OR its paired HSU radio has a
  // problem — deliberately NOT any other equipment sharing the site id (switches, UPS, backbone
  // P2P links), which would over-flag cameras as offline for shared infrastructure that doesn't
  // necessarily take that specific camera down. This is a functional/executive dashboard, not a
  // precise technical one — bias toward showing a camera as operational unless there's a fairly
  // direct signal it isn't.
  const siteIdsWithProblems = new Set<string>();
  for (const host of hosts) {
    if (!hostIdsWithProblems.has(host.hostid)) continue;
    if (!/\bHSU\b/i.test(host.name) && classifyHostKind(host.name) !== 'camera') continue;
    const siteId = extractSiteId(host.name);
    if (siteId) siteIdsWithProblems.add(siteId);
  }

  const isCameraOnline = (camera: ZabbixHost) => {
    const siteId = extractSiteId(camera.name);
    if (siteId && siteIdsWithProblems.has(siteId)) return false;
    return !hostIdsWithProblems.has(camera.hostid);
  };

  const camerasOnline = cameras.filter(isCameraOnline).length;

  const siteIds = new Set<string>();
  const siteIdsOnline = new Set<string>();
  for (const camera of cameras) {
    const siteId = extractSiteId(camera.name);
    if (!siteId) continue;
    siteIds.add(siteId);
    if (isCameraOnline(camera)) siteIdsOnline.add(siteId);
  }

  return {
    clientName,
    estadoGeneral: problems.length === 0 ? 'OPERATIVO' : 'CON_INCIDENCIAS',
    camarasOnline: camerasOnline,
    camarasTotal: cameras.length,
    sitiosOnline: siteIdsOnline.size,
    sitiosTotal: siteIds.size,
    incidentesActivos: problems.length,
    disponibilidadPct: cameras.length > 0 ? Math.round((camerasOnline / cameras.length) * 1000) / 10 : 100,
  };
}

// ---------------------------------------------------------------------------
// Proactive alerting — detects conditions worth an automatic Zoho ticket:
// a critical server/archiver or UPS down, or camera availability below 80%.
// ---------------------------------------------------------------------------

export type CriticalKind = 'server' | 'ups' | 'camaras';

export interface CriticalCondition {
  kind: CriticalKind;
  /** Unique per condition — used as the Zoho ticket dedupe marker, so re-polling doesn't spam tickets. */
  label: string;
  ageSeconds: number;
}

/** ARCHIVER/IDRAC/DIRECTORY hosts are recording/domain servers; UPS hosts are electrical backup. */
function classifyCriticalInfra(name: string): 'server' | 'ups' | null {
  if (/\b(ARCHIVER|IDRAC|DIRECTORY)\b/i.test(name)) return 'server';
  if (/\bUPS\b/i.test(name)) return 'ups';
  return null;
}

/**
 * Finds conditions that have been active for at least `sustainedSeconds` (default 5 min) — using
 * each problem's own Zabbix `clock` as the "since" timestamp, so no extra state needs to be
 * persisted just to know how long something has been down.
 */
export async function getCriticalConditions(
  clientName: string,
  groupId: string,
  sustainedSeconds = 300
): Promise<{ snapshot: AccountZabbixSnapshot; conditions: CriticalCondition[] }> {
  const hosts = await getHostsInGroup(groupId);
  const problems = await getActiveProblems(hosts.map(h => h.hostid));
  const nowSec = Math.floor(Date.now() / 1000);
  const hostById = new Map(hosts.map(h => [h.hostid, h]));

  const seenInfraHosts = new Set<string>();
  const conditions: CriticalCondition[] = [];
  let maxCameraRelatedAge = 0;

  for (const problem of problems) {
    const host = hostById.get(problem.hostid);
    if (!host) continue;
    const age = nowSec - Number(problem.clock);

    const infraKind = classifyCriticalInfra(host.name);
    if (infraKind && age >= sustainedSeconds && !seenInfraHosts.has(host.name)) {
      seenInfraHosts.add(host.name);
      conditions.push({ kind: infraKind, label: host.name, ageSeconds: age });
    }

    if (classifyHostKind(host.name) === 'camera' || /\bHSU\b/i.test(host.name)) {
      maxCameraRelatedAge = Math.max(maxCameraRelatedAge, age);
    }
  }

  const snapshot = await computeAccountSnapshot(clientName, groupId);
  if (snapshot.camarasTotal > 0 && snapshot.disponibilidadPct < 80 && maxCameraRelatedAge >= sustainedSeconds) {
    conditions.push({
      kind: 'camaras',
      label: `disponibilidad-camaras-${clientName}`,
      ageSeconds: maxCameraRelatedAge,
    });
  }

  return { snapshot, conditions };
}
