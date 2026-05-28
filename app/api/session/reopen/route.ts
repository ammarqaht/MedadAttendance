import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

  await prisma.session.updateMany({
    where: { endedAt: null, NOT: { id } },
    data: { endedAt: new Date() }
  });

  const reopened = await prisma.session.update({
    where: { id },
    data: { endedAt: null }
  });
  rotateToken(id);
  return NextResponse.json({ session: reopened });
}
