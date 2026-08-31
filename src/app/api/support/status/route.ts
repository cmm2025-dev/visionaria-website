import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import {
  computeSnapshot,
  findContactByEmail,
  getAccountTickets,
  getAccountZabbixGroup,
  getClientInventory,
  getServiceAccessToken,
  resolveAccessibleAccounts,
  type InventoryItem,
} from '@/lib/zoho';
import { getHostGroupByName, computeAccountSnapshot, type AccountZabbixSnapshot } from '@/lib/zabbix';

function sumInventory(items: InventoryItem[][]): InventoryItem[] {
  const totals = new Map<string, number>();
  for (const list of items) {
    for (const item of list) {
      totals.set(item.assetType, (totals.get(item.assetType) ?? 0) + item.totalCount);
    }
  }
  return Array.from(totals, ([assetType, totalCount]) => ({ assetType, totalCount }));
}

/** Zabbix is a separate, best-effort integration — a failure here must never break the Zoho-backed dashboard. */
async function safeZabbixSnapshot(serviceToken: string, accountId: string, accountName: string): Promise<AccountZabbixSnapshot | null> {
  try {
    const groupName = await getAccountZabbixGroup(serviceToken, accountId);
    if (!groupName) return null;
    const group = await getHostGroupByName(groupName);
    if (!group) return null;
    return await computeAccountSnapshot(accountName, group.groupid);
  } catch (err) {
    console.error('zabbix snapshot failed', accountId, err);
    return null;
  }
}

function sumZabbix(clientName: string, snapshots: AccountZabbixSnapshot[]): AccountZabbixSnapshot | null {
  if (snapshots.length === 0) return null;
  return snapshots.reduce(
    (acc, s) => ({
      clientName,
      estadoGeneral: acc.estadoGeneral === 'CON_INCIDENCIAS' || s.estadoGeneral === 'CON_INCIDENCIAS' ? 'CON_INCIDENCIAS' : 'OPERATIVO',
      camarasOnline: acc.camarasOnline + s.camarasOnline,
      camarasTotal: acc.camarasTotal + s.camarasTotal,
      sitiosOnline: acc.sitiosOnline + s.sitiosOnline,
      sitiosTotal: acc.sitiosTotal + s.sitiosTotal,
      incidentesActivos: acc.incidentesActivos + s.incidentesActivos,
      disponibilidadPct: 0, // recomputed below
    }),
    { clientName, estadoGeneral: 'OPERATIVO', camarasOnline: 0, camarasTotal: 0, sitiosOnline: 0, sitiosTotal: 0, incidentesActivos: 0, disponibilidadPct: 100 } as AccountZabbixSnapshot
  );
}

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? decodeSession(cookie) : null;
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  try {
    const serviceToken = await getServiceAccessToken();
    const contact = await findContactByEmail(serviceToken, session.email);
    if (!contact || !contact.accountId) {
      return NextResponse.json({ error: 'no_account' }, { status: 404 });
    }

    const accessibleAccounts = await resolveAccessibleAccounts(serviceToken, contact);
    if (accessibleAccounts.length === 0) {
      return NextResponse.json({ error: 'no_account' }, { status: 404 });
    }

    // Fetched with limited concurrency (not Promise.all over every account at once) -- a
    // full-access view can span dozens of accounts, and firing them all simultaneously trips
    // Zoho's concurrent-API-call limit (429 TOO_MANY_REQUESTS).
    const CONCURRENCY = 4;
    const perAccount: ({ accountId: string; inventory: InventoryItem[]; zabbix: AccountZabbixSnapshot | null } & ReturnType<typeof computeSnapshot>)[] = [];
    for (let i = 0; i < accessibleAccounts.length; i += CONCURRENCY) {
      const batch = accessibleAccounts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async account => {
          const [tickets, inventory, zabbix] = await Promise.all([
            getAccountTickets(serviceToken, account.id),
            getClientInventory(serviceToken, account.id),
            safeZabbixSnapshot(serviceToken, account.id, account.name),
          ]);
          return { accountId: account.id, inventory, zabbix, ...computeSnapshot(account.name, tickets) };
        })
      );
      perAccount.push(...results);
    }

    const isMultiAccount = perAccount.length > 1;
    const aggregateLabel = contact.fullAccess ? 'Postventa — todos los clientes' : 'Resumen regional';
    const aggregate = isMultiAccount
      ? computeSnapshot(aggregateLabel, perAccount.flatMap(a => a.tickets))
      : perAccount[0];
    const aggregateInventory = isMultiAccount ? sumInventory(perAccount.map(a => a.inventory)) : perAccount[0].inventory;
    const zabbixSnapshots = perAccount.map(a => a.zabbix).filter((z): z is AccountZabbixSnapshot => z !== null);
    const aggregateZabbix = isMultiAccount
      ? sumZabbix(aggregateLabel, zabbixSnapshots)
      : perAccount[0].zabbix;
    if (aggregateZabbix) {
      aggregateZabbix.disponibilidadPct = aggregateZabbix.camarasTotal > 0
        ? Math.round((aggregateZabbix.camarasOnline / aggregateZabbix.camarasTotal) * 1000) / 10
        : 100; // no cameras to report on — matches computeAccountSnapshot's single-account default, not "everything down"
    }

    return NextResponse.json({
      ...aggregate,
      inventory: aggregateInventory,
      zabbix: aggregateZabbix,
      isMultiAccount,
      accounts: isMultiAccount ? perAccount : undefined,
    });
  } catch (err) {
    console.error('support/status failed', err);
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
}
