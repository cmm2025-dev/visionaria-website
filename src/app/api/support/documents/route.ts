import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import { findContactByEmail, getClientDocuments, getServiceAccessToken } from '@/lib/zoho';

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

    const documents = await getClientDocuments(serviceToken, contact.accountId);
    return NextResponse.json({ clientName: contact.accountName ?? contact.accountId, documents });
  } catch (err) {
    console.error('support/documents failed', err);
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
}
