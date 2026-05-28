import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
  const sid = Number(req.nextUrl.searchParams.get('sessionId'));
  if (!sid) return new Response('sessionId required', { status: 400 });

  const session = await prisma.session.findUnique({ where: { id: sid } });
  if (!session) return new Response('Not found', { status: 404 });

  const items = await prisma.attendance.findMany({
    where: { sessionId: sid },
    orderBy: { checkedAt: 'asc' },
    include: { student: true }
  });

  const header = ['الاسم', 'رقم الطالب', 'التاريخ', 'الوقت', 'الطريقة'];
  const rows = items.map((a) => [
    a.student.fullName,
    a.student.studentId,
    new Date(a.checkedAt).toLocaleDateString('ar-SA'),
    new Date(a.checkedAt).toLocaleTimeString('ar-SA'),
    a.method === 'qr' ? 'QR' : 'يدوي'
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="session-${sid}.csv"`
    }
  });
}
