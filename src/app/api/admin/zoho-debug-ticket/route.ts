import { NextRequest, NextResponse } from 'next/server';
import { getServiceAccessToken } from '@/lib/zoho';

export const runtime = 'nodejs';

/**
 * Temporary diagnostic route: fetches a ticket's raw JSON via the service account so we can read
 * the real cf_* API names Zoho generated for custom fields. Protected by ZOHO_SETUP_SECRET.
 * Delete once field names are confirmed.
 */
export async function GET(req: NextRequest) {
  const setupSecret = process.env.ZOHO_SETUP_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!setupSecret || key !== setupSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const ticketId = req.nextUrl.searchParams.get('id');
  if (!ticketId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const serviceToken = await getServiceAccessToken();
  const orgId = process.env.ZOHO_ORG_ID ?? '';
  const res = await fetch(`https://desk.zoho.com/api/v1/tickets/${ticketId}`, {
    headers: { Authorization: `Zoho-oauthtoken ${serviceToken}`, orgId },
  });
  const data = await res.json();
  return NextResponse.json({ status: res.status, cf: data.cf ?? null, data });
}
