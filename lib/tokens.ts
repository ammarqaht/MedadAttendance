import { v4 as uuid } from 'uuid';

type TokenRecord = {
  current: { token: string; expiresAt: number } | null;
  previous: { token: string; expiresAt: number } | null;
};

const ROTATE_MS = 5_000;
const GRACE_MS = 5_000;

const store = new Map<number, TokenRecord>();

export function rotateToken(sessionId: number) {
  const rec = store.get(sessionId) ?? { current: null, previous: null };
  const now = Date.now();
  const fresh = { token: uuid(), expiresAt: now + ROTATE_MS };
  rec.previous = rec.current;
  rec.current = fresh;
  store.set(sessionId, rec);
  return fresh.token;
}

export function getOrRotate(sessionId: number) {
  const rec = store.get(sessionId);
  const now = Date.now();
  if (!rec || !rec.current || rec.current.expiresAt <= now) {
    return rotateToken(sessionId);
  }
  return rec.current.token;
}

export function isValidToken(sessionId: number, token: string): boolean {
  const rec = store.get(sessionId);
  if (!rec) return false;
  const now = Date.now();
  if (rec.current && rec.current.token === token && rec.current.expiresAt + GRACE_MS > now) return true;
  if (rec.previous && rec.previous.token === token && rec.previous.expiresAt + GRACE_MS > now) return true;
  return false;
}

export function clearTokens(sessionId: number) {
  store.delete(sessionId);
}
