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
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? `جلسة ${new Date().toLocaleDateString('ar-SA')}`);

  // One session per day — reuse today's session if one already exists
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

  const todays = await prisma.session.findFirst({
    where: { startedAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { startedAt: 'asc' }
  });

  // End any other open session that isn't today's
  await prisma.session.updateMany({
    where: { endedAt: null, NOT: { id: todays?.id ?? -1 } },
    data: { endedAt: new Date() }
  });

  if (todays) {
    if (todays.endedAt) {
      await prisma.session.update({ where: { id: todays.id }, data: { endedAt: null } });
    }
    rotateToken(todays.id);
    return NextResponse.json({ session: { ...todays, endedAt: null }, reused: true });
  }

  const created = await prisma.session.create({ data: { title } });
  rotateToken(created.id);
  return NextResponse.json({ session: created, reused: false });
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const active = await prisma.session.findFirst({ where: { endedAt: null }, orderBy: { startedAt: 'desc' } });
  return NextResponse.json({ session: active });
}
