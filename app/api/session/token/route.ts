import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { rotateToken } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { sessionId } = await req.json();
  const id = Number(sessionId);
  if (!id) return NextResponse.json({ error: 'معرّف الجلسة مفقود' }, { status: 400 });
  const token = rotateToken(id);
  return NextResponse.json({ token, sessionId: id, expiresInMs: 5000 });
}
