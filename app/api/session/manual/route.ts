import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publish, sessionChannel } from '@/lib/events';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { sessionId, studentId } = await req.json();
  const sid = Number(sessionId);
  if (!sid || !studentId) return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });

  const session = await prisma.session.findUnique({ where: { id: sid } });
  if (!session) return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });

  const student = await prisma.student.findUnique({ where: { studentId: String(studentId) } });
  if (!student) return NextResponse.json({ error: 'رقم الطالب غير موجود' }, { status: 404 });

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId: sid, studentId: student.id } }
  });
  if (existing) return NextResponse.json({ error: 'الطالب مُسجَّل مسبقًا في هذه الجلسة', student: { id: student.id, fullName: student.fullName, studentId: student.studentId } }, { status: 409 });

  const att = await prisma.attendance.create({
    data: { sessionId: sid, studentId: student.id, method: 'manual' }
  });

  publish(sessionChannel(sid), {
    type: 'check-in',
    method: 'manual',
    studentId: student.studentId,
    fullName: student.fullName,
    checkedAt: att.checkedAt
  });

  return NextResponse.json({
    ok: true,
    student: { id: student.id, fullName: student.fullName, studentId: student.studentId },
    checkedAt: att.checkedAt
  });
}
