import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * One-time admin flow to mint the long-lived refresh token the backend uses to read Desk
 * data on behalf of all clients (never the end user's own login token). Visit this route
 * once (with ?key=ZOHO_SETUP_SECRET) as a Zoho admin, approve the Desk scopes, and copy the
 * refresh_token shown into ZOHO_SERVICE_REFRESH_TOKEN in Vercel. Nothing here is persisted.
 */
export async function GET(req: NextRequest) {
  const setupSecret = process.env.ZOHO_SETUP_SECRET;
  if (!setupSecret) return NextResponse.json({ error: 'not_configured' }, { status: 500 });

  const code = req.nextUrl.searchParams.get('code');
  const redirectUri = `${req.nextUrl.origin}/api/admin/zoho-service-auth`;

  if (!code) {
    // Initial visit: require the setup key explicitly, then hand off to Zoho with it as `state`.
    const key = req.nextUrl.searchParams.get('key');
    if (key !== setupSecret) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const clientId = process.env.ZOHO_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: 'not_configured' }, { status: 500 });
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'Desk.tickets.READ,Desk.contacts.READ,Desk.basic.READ,Desk.search.READ',
      redirect_uri: redirectUri,
      access_type: 'offline',
      prompt: 'consent',
      state: setupSecret,
    });
    return NextResponse.redirect(`https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`);
  }

  // Callback from Zoho: it only round-trips `state`, not the original `key` query param.
  const state = req.nextUrl.searchParams.get('state');
  if (state !== setupSecret) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.ZOHO_CLIENT_ID ?? '',
    client_secret: process.env.ZOHO_CLIENT_SECRET ?? '',
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', { method: 'POST', body: params });
  const data = await res.json();

  if (!res.ok || !data.refresh_token) {
    return NextResponse.json({ error: 'exchange_failed', detail: data }, { status: 502 });
  }

  return new NextResponse(
    `<pre>Copy this value into ZOHO_SERVICE_REFRESH_TOKEN in Vercel, then delete this route:\n\n${data.refresh_token}</pre>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
