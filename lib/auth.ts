import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'medad-attendance-dev-secret-please-change-32bytes'
);
const COOKIE_NAME = 'medad_session';

export type Session = {
  role: 'admin' | 'student';
  id: number;
  username?: string;
  studentId?: string;
  fullName?: string;
};

export async function signSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: Session) {
  const token = await signSession(session);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const tok = jar.get(COOKIE_NAME)?.value;
  if (!tok) return null;
  return await verifySession(tok);
}

export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  const tok = req.cookies.get(COOKIE_NAME)?.value;
  if (!tok) return null;
  return await verifySession(tok);
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== 'admin') throw new Error('UNAUTHORIZED');
  return s;
}

export async function requireStudent(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== 'student') throw new Error('UNAUTHORIZED');
  return s;
}
