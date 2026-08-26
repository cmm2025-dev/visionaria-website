import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import {
  computeSnapshot,
  findContactByEmail,
  getAccountTickets,
  getServiceAccessToken,
  resolveAccessibleAccounts,
} from '@/lib/zoho';

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

    const perAccount = await Promise.all(
      accessibleAccounts.map(async account => {
        const tickets = await getAccountTickets(serviceToken, account.id);
        return { accountId: account.id, ...computeSnapshot(account.name, tickets) };
      })
    );

    const isMultiAccount = perAccount.length > 1;
    const aggregateLabel = contact.fullAccess ? 'Postventa — todos los clientes' : 'Resumen regional';
    const aggregate = isMultiAccount
      ? computeSnapshot(aggregateLabel, perAccount.flatMap(a => a.tickets))
      : perAccount[0];

    return NextResponse.json({
      ...aggregate,
      isMultiAccount,
      accounts: isMultiAccount ? perAccount : undefined,
    });
  } catch (err) {
    console.error('support/status failed', err);
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
}
