import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';

export async function GET() {
  let me;
  try {
    me = await requireStudent();
  } catch {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
  }
  const totalSessions = await prisma.session.count();
  const myAttendances = await prisma.attendance.findMany({
    where: { studentId: me.id },
    orderBy: { checkedAt: 'desc' },
    include: { session: true }
  });
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: 'desc' }
  });
  return NextResponse.json({
    me: { id: me.id, studentId: me.studentId, fullName: me.fullName },
    points: myAttendances.length,
    totalSessions,
    pct: totalSessions ? Math.round((myAttendances.length / totalSessions) * 100) : 0,
    activeSessionId: activeSession?.id ?? null,
    log: myAttendances.map((a) => ({
      id: a.id,
      title: a.session.title,
      method: a.method,
      checkedAt: a.checkedAt
    }))
  });
}
