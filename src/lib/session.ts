import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SALT = 'visionaria-support-session-v1';

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return scryptSync(secret, SALT, 32);
}

export interface SupportSession {
  email: string;
  issuedAt: number;
}

/** Encrypts a session payload into an opaque cookie value (AES-256-GCM, base64url). */
export function encodeSession(payload: SupportSession): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

/** Decrypts a cookie value produced by encodeSession. Returns null if invalid/tampered/expired. */
export function decodeSession(value: string, maxAgeMs = 1000 * 60 * 60 * 8): SupportSession | null {
  try {
    const key = getKey();
    const buf = Buffer.from(value, 'base64url');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const payload = JSON.parse(decrypted.toString('utf8')) as SupportSession;
    if (typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null;
    if (Date.now() - payload.issuedAt > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'visionaria_support_session';
