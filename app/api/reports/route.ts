import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  const studentFilter = req.nextUrl.searchParams.get('student');
  const method = req.nextUrl.searchParams.get('method');

  const where: any = {};
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to) where.startedAt.lte = new Date(to + 'T23:59:59');
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startedAt: 'asc' }
  });

  const sessionIds = sessions.map((s) => s.id);

  const attWhere: any = { sessionId: { in: sessionIds } };
  if (method && (method === 'qr' || method === 'manual')) attWhere.method = method;

  const attendances = await prisma.attendance.findMany({
    where: attWhere,
    include: { student: true }
  });

  let studentsList = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });
  if (studentFilter) {
    studentsList = studentsList.filter(
      (s) =>
        s.fullName.includes(studentFilter) ||
        s.studentId.includes(studentFilter)
    );
  }

  const grid = studentsList.map((stu) => {
    const cells = sessions.map((sess) => {
      const present = attendances.some((a) => a.sessionId === sess.id && a.studentId === stu.id);
      return present;
    });
    const points = cells.filter(Boolean).length;
    const pct = sessions.length ? Math.round((points / sessions.length) * 100) : 0;
    return {
      id: stu.id,
      fullName: stu.fullName,
      studentId: stu.studentId,
      cells,
      points,
      pct
    };
  });

  // General stats
  const totalSessions = sessions.length;
  const totalStudents = studentsList.length;
  const avgRate =
    totalSessions === 0 || totalStudents === 0
      ? 0
      : Math.round(
          (attendances.length / (totalSessions * totalStudents)) * 100
        );

  const ranked = [...grid].sort((a, b) => b.points - a.points);
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-3).reverse();

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      startedAt: s.startedAt,
      endedAt: s.endedAt
    })),
    grid,
    stats: { totalSessions, totalStudents, avgRate, top, bottom }
  });
}
