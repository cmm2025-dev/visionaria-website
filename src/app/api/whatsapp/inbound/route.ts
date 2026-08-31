import { NextRequest, NextResponse } from 'next/server';
import {
  findContactByPhone,
  getServiceAccessToken,
  buildAgentContextSummary,
  getClientInventory,
  createTicket,
  computeTicketPriority,
} from '@/lib/zoho';
import { startConversation, handleMessage } from '@/lib/whatsappFlow';
import { getConversationState, setConversationState, clearConversationState } from '@/lib/conversationStore';

export const runtime = 'nodejs';

/**
 * Inbound WhatsApp Business webhook — NOT YET LIVE.
 *
 * Requires a matching WHATSAPP_WEBHOOK_SECRET (sent by the caller as the X-Webhook-Secret
 * header) once WHATSAPP_WEBHOOK_ENABLED='1' — otherwise still disabled because two things
 * are unresolved:
 *
 *   1. Payload shape: whichever channel ends up calling this (Zoho Desk's native WhatsApp
 *      channel via an automation/webhook, or the Meta Cloud API directly) has its own real
 *      shape and signature scheme that we haven't seen yet — the parsing below is a guess.
 *   2. Reply delivery: this handler computes what to say back (via src/lib/whatsappFlow.ts) but
 *      does NOT yet send it to WhatsApp. Once we see a real inbound payload we'll know whether
 *      the reply goes back as this response's body (some webhook systems accept that) or needs
 *      a separate outbound API call — don't want to guess an endpoint here the way earlier ones
 *      in this project were guessed wrong (see zoho.ts field-name history).
 *   3. Conversation state (src/lib/conversationStore.ts) is in-memory only — fine for local
 *      testing, not durable across serverless invocations. Needs a real store before this goes live.
 *
 * The menu → questionnaire → ticket flow itself is fully implemented and reusable regardless of
 * how the above gets resolved.
 */
export async function POST(req: NextRequest) {
  // Discovery mode: log whatever arrives, in whatever shape, without assuming anything about
  // it or running any real logic — this is how we find out the actual payload Zoho's webhook
  // automation sends, the same way every other Zoho field/shape in this project got confirmed.
  if (process.env.WHATSAPP_WEBHOOK_DISCOVERY === '1') {
    const rawText = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    console.log('WHATSAPP_INBOUND_DISCOVERY', JSON.stringify({ headers, body: rawText }).slice(0, 4000));
    return NextResponse.json({ ok: true, discovery: true });
  }

  if (process.env.WHATSAPP_WEBHOOK_ENABLED !== '1') {
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  // Shared-secret check: without this, anyone who finds this URL could POST a fabricated
  // {"from": "<known client phone>", "text": "..."} and drive the questionnaire to completion,
  // creating real tickets. Configure the same value as an HTTP header on the caller's side (e.g.
  // Zoho's webhook "Custom Headers") — header name/value are ours to define since we control the
  // receiving end.
  const providedSecret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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

  const priorState = await getConversationState(senderPhone);
  const result = priorState ? handleMessage(priorState, messageText) : startConversation();

  // Check the permission at the moment the client enters the fault-report flow (right after
  // choosing menu option "2"), not after they've already answered the whole questionnaire —
  // no point making a view-only contact answer 6+ questions just to reject them at the end.
  const enteringReportFlow = result.state?.step === 'tipoFalla' && (!priorState || priorState.step === 'menu');
  if (enteringReportFlow && !contact.canCreateTickets) {
    await clearConversationState(senderPhone);
    return NextResponse.json({
      ok: true,
      reply: 'Tu cuenta no está habilitada para generar solicitudes de soporte. Un agente revisará tu mensaje.',
    });
  }

  if (result.action === 'create_ticket' && result.ticketInput) {
    await clearConversationState(senderPhone);

    const inventory = contact.accountId ? await getClientInventory(serviceToken, contact.accountId) : [];
    const priority = computeTicketPriority(
      result.ticketInput.tipoFalla,
      result.ticketInput.camarasAfectadas,
      result.ticketInput.fallaGlobal,
      inventory
    );
    const ticket = await createTicket(serviceToken, {
      contactId: contact.id,
      subject: `[WhatsApp] ${result.ticketInput.tipoFalla}`,
      description: `Reporte generado vía WhatsApp.\nUbicación: ${result.ticketInput.ubicacion}`,
      ...result.ticketInput,
      priority,
    });

    const summary = await buildAgentContextSummary(serviceToken, contact);
    return NextResponse.json({ ok: true, reply: result.reply, ticket, summary });
  }

  if (result.state) {
    await setConversationState(senderPhone, result.state);
  } else {
    await clearConversationState(senderPhone);
  }

  return NextResponse.json({ ok: true, reply: result.reply });
}
