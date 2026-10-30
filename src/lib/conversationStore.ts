import type { WhatsAppConversationState } from '@/lib/whatsappFlow';

/**
 * Per-phone-number conversation state, keyed between one inbound WhatsApp message and the next.
 *
 * NOT PRODUCTION-READY: this is an in-memory Map, which only works as long as a single server
 * instance handles every request for a given conversation and never restarts — false on Vercel's
 * serverless functions (no shared memory across invocations, cold starts reset it). Before
 * enabling the live webhook, swap this for a real store (e.g. Vercel KV / Upstash Redis) behind
 * the same three functions so nothing else has to change.
 */
const store = new Map<string, WhatsAppConversationState>();

export async function getConversationState(phone: string): Promise<WhatsAppConversationState | null> {
  return store.get(phone) ?? null;
}

export async function setConversationState(phone: string, state: WhatsAppConversationState): Promise<void> {
  store.set(phone, state);
}

export async function clearConversationState(phone: string): Promise<void> {
  store.delete(phone);
}
