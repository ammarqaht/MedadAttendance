import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { studentId, password } = await req.json();
  if (!studentId || !password) {
    return NextResponse.json({ error: 'يرجى إدخال رقم الطالب وكلمة المرور' }, { status: 400 });
  }
  const s = await prisma.student.findUnique({ where: { studentId: String(studentId) } });
  if (!s || !(await bcrypt.compare(String(password), s.passwordHash))) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }
  await setSessionCookie({
    role: 'student',
    id: s.id,
    studentId: s.studentId,
    fullName: s.fullName
  });
  return NextResponse.json({ ok: true });
}
