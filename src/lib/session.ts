import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// scryptSync is deliberately expensive (CPU-bound, blocks the event loop) -- fine to pay once,
// not on every encode/decode call. SESSION_SECRET and each salt are both constants for the life
// of the process, so the derived key never changes; cache it per salt instead of re-deriving.
const keyCache = new Map<string, Buffer>();

function getKey(salt: string): Buffer {
  const cached = keyCache.get(salt);
  if (cached) return cached;
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  const key = scryptSync(secret, salt, 32);
  keyCache.set(salt, key);
  return key;
}

/** Encrypts a JSON-serializable payload into an opaque base64url token (AES-256-GCM). */
function encrypt(salt: string, payload: unknown): string {
  const key = getKey(salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/** Decrypts a token produced by encrypt(). Returns null if invalid/tampered. */
function decrypt<T>(salt: string, value: string): T | null {
  try {
    const key = getKey(salt);
    const buf = Buffer.from(value, 'base64url');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    return null;
  }
}

const SESSION_SALT = 'visionaria-support-session-v1';

export interface SupportSession {
  email: string;
  issuedAt: number;
}

/** Encrypts a session payload into an opaque cookie value. */
export function encodeSession(payload: SupportSession): string {
  return encrypt(SESSION_SALT, payload);
}

/** Decrypts a cookie value produced by encodeSession. Returns null if invalid/tampered/expired. */
export function decodeSession(value: string, maxAgeMs = 1000 * 60 * 60 * 8): SupportSession | null {
  const payload = decrypt<SupportSession>(SESSION_SALT, value);
  if (!payload || typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null;
  if (Date.now() - payload.issuedAt > maxAgeMs) return null;
  return payload;
}

export const SESSION_COOKIE = 'visionaria_support_session';

const MAGIC_SALT = 'visionaria-magic-link-v1';

export interface MagicLinkPayload {
  email: string;
  next: string;
  locale: string;
  issuedAt: number;
}

/**
 * Encodes a short-lived, single-purpose magic-link token. Not tracked as "used" server-side
 * (no persistent store) -- the short expiry window is the primary defense against replay.
 */
export function encodeMagicLink(payload: Omit<MagicLinkPayload, 'issuedAt'>): string {
  return encrypt(MAGIC_SALT, { ...payload, issuedAt: Date.now() });
}

/** Decodes a magic-link token. Returns null if invalid/tampered/expired. */
export function decodeMagicLink(value: string, maxAgeMs = 1000 * 60 * 15): MagicLinkPayload | null {
  const payload = decrypt<MagicLinkPayload>(MAGIC_SALT, value);
  if (!payload || typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null;
  if (Date.now() - payload.issuedAt > maxAgeMs) return null;
  return payload;
}

// Intranet (staff) auth uses its own salts and cookie, kept separate from the client-support
// session above -- a token or cookie minted for one must never be usable to authenticate the other.

const INTRANET_MAGIC_SALT = 'visionaria-intranet-magic-link-v1';

export interface IntranetMagicLinkPayload {
  email: string;
  locale: string;
  issuedAt: number;
}

export function encodeIntranetMagicLink(payload: Omit<IntranetMagicLinkPayload, 'issuedAt'>): string {
  return encrypt(INTRANET_MAGIC_SALT, { ...payload, issuedAt: Date.now() });
}

export function decodeIntranetMagicLink(value: string, maxAgeMs = 1000 * 60 * 15): IntranetMagicLinkPayload | null {
  const payload = decrypt<IntranetMagicLinkPayload>(INTRANET_MAGIC_SALT, value);
  if (!payload || typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null;
  if (Date.now() - payload.issuedAt > maxAgeMs) return null;
  return payload;
}

const INTRANET_SESSION_SALT = 'visionaria-intranet-session-v1';

export interface IntranetSession {
  email: string;
  issuedAt: number;
}

export function encodeIntranetSession(payload: IntranetSession): string {
  return encrypt(INTRANET_SESSION_SALT, payload);
}

export function decodeIntranetSession(value: string, maxAgeMs = 1000 * 60 * 60 * 8): IntranetSession | null {
  const payload = decrypt<IntranetSession>(INTRANET_SESSION_SALT, value);
  if (!payload || typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null;
  if (Date.now() - payload.issuedAt > maxAgeMs) return null;
  return payload;
}

export const INTRANET_SESSION_COOKIE = 'visionaria_intranet_session';

/** Staff are recognized by company email domain -- no separate roster to maintain. */
export function isStaffEmail(email: string): boolean {
  return /^[^@\s]+@visionaria\.cl$/i.test(email.trim());
}

/** A short, explicit allowlist (env var, comma-separated) of who can edit intranet content. */
export function isIntranetAdmin(email: string): boolean {
  const allowlist = (process.env.INTRANET_ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}
