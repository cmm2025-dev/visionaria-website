import { NextRequest, NextResponse } from 'next/server';
import {
  findContactByPhone,
  getServiceAccessToken,
  buildAgentContextSummary,
  maybeAutoCreateTicket,
} from '@/lib/zoho';

export const runtime = 'nodejs';

/**
 * Inbound WhatsApp Business webhook — NOT YET LIVE.
 *
 * The WhatsApp Business number is still pending validation with Meta/Zoho, so this route has
 * nothing real to receive yet. It's left here, disabled, as the wiring point for once that's
 * resolved: whichever channel we end up on (Zoho Desk's native WhatsApp channel, or the Meta
 * Cloud API directly) will POST here per-message, and the flow is already implemented in
 * src/lib/zoho.ts:
 *
 *   1. findContactByPhone(serviceToken, senderPhone)  — identify who's writing
 *   2. buildAgentContextSummary(serviceToken, contact) — attach as context for the agent
 *   3. maybeAutoCreateTicket(serviceToken, contact, messageText) — only for high-severity messages
 *
 * Before enabling: add signature verification for whichever provider we land on (Meta sends an
 * X-Hub-Signature-256 HMAC over the raw body; Zoho's native channel uses its own webhook secret),
 * and confirm the actual payload shape — the body parsing below is a placeholder guess, not a
 * verified contract.
 */
export async function POST(req: NextRequest) {
  if (process.env.WHATSAPP_WEBHOOK_ENABLED !== '1') {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  const body = await req.json();
  const senderPhone: string | undefined = body?.from;
  const messageText: string | undefined = body?.text;
  if (!senderPhone || !messageText) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const serviceToken = await getServiceAccessToken();
  const contact = await findContactByPhone(serviceToken, senderPhone);
  if (!contact) {
    return NextResponse.json({ ok: true, matched: false });
  }

  const [summary, ticket] = await Promise.all([
    buildAgentContextSummary(serviceToken, contact),
    maybeAutoCreateTicket(serviceToken, contact, messageText),
  ]);

  return NextResponse.json({ ok: true, matched: true, summary, ticket });
}
