import { NextRequest, NextResponse } from 'next/server';
import { getServiceAccessToken, getAllAccounts, getAccountZabbixGroup, createProactiveAlertTicket } from '@/lib/zoho';
import { getHostGroupByName, getCriticalConditions, type CriticalCondition } from '@/lib/zabbix';

export const runtime = 'nodejs';

/**
 * Proactive alerting: run on a schedule (Vercel Cron — not yet wired, see vercel.json) to create
 * a Zoho ticket automatically when a critical device has been down for a sustained period, without
 * waiting for a client to report it.
 *
 * Covers: a server/archiver host down, a UPS/power host down, or a client's camera availability
 * staying below 80% — all sustained for 5+ minutes (see getCriticalConditions). Dedup is handled
 * by createProactiveAlertTicket checking for an already-open ticket with the same marker, so
 * re-running this on a schedule doesn't create duplicate tickets for an ongoing outage.
 *
 * Gated by ZOHO_SETUP_SECRET for now (manual testing via ?key=...); once confirmed working,
 * configure a Vercel Cron entry to hit this on a schedule (e.g. every 10 minutes) instead.
 */
export async function GET(req: NextRequest) {
  const setupSecret = process.env.ZOHO_SETUP_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!setupSecret || key !== setupSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const serviceToken = await getServiceAccessToken();
  const accounts = await getAllAccounts(serviceToken);

  const results: Record<string, unknown>[] = [];

  for (const account of accounts) {
    try {
      const groupName = await getAccountZabbixGroup(serviceToken, account.id);
      if (!groupName) continue;

      const group = await getHostGroupByName(groupName);
      if (!group) {
        results.push({ account: account.name, error: `zabbix host group "${groupName}" not found` });
        continue;
      }

      const { conditions } = await getCriticalConditions(account.name, group.groupid);
      for (const condition of conditions) {
        const ticket = await createProactiveAlertTicket(serviceToken, {
          accountId: account.id,
          dedupeMarker: condition.label,
          subject: subjectFor(condition),
          description: descriptionFor(condition, account.name),
          tipoFalla: tipoFallaFor(condition),
          camarasAfectadas: null,
        });
        results.push({ account: account.name, condition, ticket: ticket ?? 'already_open' });
      }
    } catch (err) {
      results.push({ account: account.name, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, checked: accounts.length, results });
}

function subjectFor(c: CriticalCondition): string {
  if (c.kind === 'server') return `Servidor caído: ${c.label}`;
  if (c.kind === 'ups') return `Falla de energía / UPS: ${c.label}`;
  return 'Disponibilidad de cámaras bajo el 80%';
}

function descriptionFor(c: CriticalCondition, clientName: string): string {
  const minutes = Math.round(c.ageSeconds / 60);
  return `Detectado automáticamente por el sistema de monitoreo (Zabbix) para ${clientName}. La condición lleva sostenida aproximadamente ${minutes} minutos.`;
}

// TODO: "ups" reuses the closest existing Zoho picklist value (Falla de Sistema de Grabacion) —
// confirm the real value Zoho expects for power/UPS faults once this runs against production data,
// same as every other cf_tipo_de_falla value in this project was confirmed via real API responses.
function tipoFallaFor(c: CriticalCondition): string {
  if (c.kind === 'server') return 'Falla de Servidores -VMS';
  if (c.kind === 'ups') return 'Falla de Sistema de Grabacion';
  return 'Camaras sin Señal';
}
