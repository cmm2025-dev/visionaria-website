import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Kicks off the "Login with Zoho" flow used purely to verify the visitor's identity. */
export function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'es';
  const nextParam = req.nextUrl.searchParams.get('next');
  const next = nextParam === 'documentos' || nextParam === 'nuevo-ticket' ? nextParam : 'estado';
  const clientId = process.env.ZOHO_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'not_configured' }, { status: 500 });

  const redirectUri = `${req.nextUrl.origin}/api/auth/zoho/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'AaaServer.profile.READ',
    redirect_uri: redirectUri,
    access_type: 'online',
    prompt: 'consent',
    state: `${locale}:${next}`,
  });

  return NextResponse.redirect(`https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`);
}
