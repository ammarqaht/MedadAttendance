import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { isValidToken } from '@/lib/tokens';
import { publish, sessionChannel } from '@/lib/events';

export async function POST(req: NextRequest) {
  let me;
  try {
    me = await requireStudent();
  } catch {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });
  }

  const { token, sessionId } = await req.json();
  const sid = Number(sessionId);
  if (!sid || !token) return NextResponse.json({ error: 'رمز غير صالح' }, { status: 400 });

  if (!isValidToken(sid, String(token))) {
    return NextResponse.json({ error: 'انتهت صلاحية الرمز، أعد المسح' }, { status: 410 });
  }

  const session = await prisma.session.findUnique({ where: { id: sid } });
  if (!session || session.endedAt) {
    return NextResponse.json({ error: 'الجلسة منتهية أو غير موجودة' }, { status: 404 });
  }

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId: sid, studentId: me.id } }
  });
  if (existing) return NextResponse.json({ error: 'أنت محضّر مسبقًا في هذه الجلسة' }, { status: 409 });

  const att = await prisma.attendance.create({
    data: { sessionId: sid, studentId: me.id, method: 'qr' }
  });

  publish(sessionChannel(sid), {
    type: 'check-in',
    method: 'qr',
    studentId: me.studentId,
    fullName: me.fullName,
    checkedAt: att.checkedAt
  });

  return NextResponse.json({ ok: true, sessionTitle: session.title, checkedAt: att.checkedAt });
}
