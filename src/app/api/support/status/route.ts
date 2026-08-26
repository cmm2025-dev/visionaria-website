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

    // Fetched with limited concurrency (not Promise.all over every account at once) -- a
    // full-access view can span dozens of accounts, and firing them all simultaneously trips
    // Zoho's concurrent-API-call limit (429 TOO_MANY_REQUESTS).
    const CONCURRENCY = 4;
    const perAccount: ({ accountId: string } & ReturnType<typeof computeSnapshot>)[] = [];
    for (let i = 0; i < accessibleAccounts.length; i += CONCURRENCY) {
      const batch = accessibleAccounts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async account => {
          const tickets = await getAccountTickets(serviceToken, account.id);
          return { accountId: account.id, ...computeSnapshot(account.name, tickets) };
        })
      );
      perAccount.push(...results);
    }

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
