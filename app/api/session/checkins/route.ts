import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const sid = Number(req.nextUrl.searchParams.get('sessionId'));
  if (!sid) return NextResponse.json({ items: [] });

  const items = await prisma.attendance.findMany({
    where: { sessionId: sid },
    orderBy: { checkedAt: 'desc' },
    include: { student: true }
  });
  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      method: a.method,
      checkedAt: a.checkedAt,
      studentId: a.student.studentId,
      fullName: a.student.fullName
    }))
  });
}
