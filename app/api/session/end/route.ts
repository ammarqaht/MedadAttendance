import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { clearTokens } from '@/lib/tokens';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { sessionId } = await req.json();
  const id = Number(sessionId);
  if (!id) return NextResponse.json({ error: 'معرّف الجلسة مفقود' }, { status: 400 });

  const updated = await prisma.session.update({
    where: { id },
    data: { endedAt: new Date() }
  });
  clearTokens(id);
  return NextResponse.json({ session: updated });
}
