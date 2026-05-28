import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  const where: any = {};
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to) where.startedAt.lte = new Date(to + 'T23:59:59');
  }

  const sessions = await prisma.session.findMany({ where, orderBy: { startedAt: 'asc' } });
  const students = await prisma.student.findMany({ orderBy: { fullName: 'asc' } });
  const attendances = await prisma.attendance.findMany({
    where: { sessionId: { in: sessions.map((s) => s.id) } }
  });

  const header = [
    'الاسم',
    'رقم الطالب',
    ...sessions.map((s) => s.title),
    'مجموع النقاط',
    'النسبة %'
  ];
  const rows = students.map((stu) => {
    const cells = sessions.map((sess) =>
      attendances.some((a) => a.sessionId === sess.id && a.studentId === stu.id) ? '✓' : '✗'
    );
    const points = cells.filter((c) => c === '✓').length;
    const pct = sessions.length ? Math.round((points / sessions.length) * 100) : 0;
    return [stu.fullName, stu.studentId, ...cells, points, pct + '%'];
  });

  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="attendance-report.csv"'
    }
  });
}
