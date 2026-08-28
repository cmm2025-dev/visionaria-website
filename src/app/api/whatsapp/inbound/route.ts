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
 * Still disabled (WHATSAPP_WEBHOOK_ENABLED!=='1') because two things are unresolved:
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

  if (result.action === 'create_ticket' && result.ticketInput) {
    await clearConversationState(senderPhone);

    if (!contact.canCreateTickets) {
      return NextResponse.json({
        ok: true,
        reply: 'Tu cuenta no está habilitada para generar solicitudes de soporte. Un agente revisará tu mensaje.',
      });
    }

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
