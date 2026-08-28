import { NextRequest, NextResponse } from 'next/server';
import { getAllHostGroups, getHostsInGroup, getActiveProblems, computeAccountSnapshot } from '@/lib/zabbix';

export const runtime = 'nodejs';

/**
 * Temporary diagnostic route: confirms the Zabbix API token/URL work, lists every real Host
 * Group name (to fill into each Account's cf_zabbix_nombre field), and optionally drills into
 * one group's hosts + active problems. Protected by ZOHO_SETUP_SECRET (reusing the same admin
 * gate as the Zoho diagnostic routes). Delete once the Zabbix integration is confirmed working.
 */
export async function GET(req: NextRequest) {
  const setupSecret = process.env.ZOHO_SETUP_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!setupSecret || key !== setupSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const groups = await getAllHostGroups();

    const groupName = req.nextUrl.searchParams.get('group');
    if (!groupName) {
      return NextResponse.json({ groups });
    }

    const group = groups.find(g => g.name === groupName);
    if (!group) {
      return NextResponse.json({ error: 'group_not_found', groups }, { status: 404 });
    }

    const snapshot = await computeAccountSnapshot(group.name, group.groupid);

    if (req.nextUrl.searchParams.get('full') !== '1') {
      return NextResponse.json({ group, snapshot });
    }

    const hosts = await getHostsInGroup(group.groupid);
    const problems = await getActiveProblems(hosts.map(h => h.hostid));
    return NextResponse.json({ group, snapshot, hosts, problems });
  } catch (err) {
    return NextResponse.json({ error: 'zabbix_error', message: String(err) }, { status: 502 });
  }
}
