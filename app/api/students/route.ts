import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const totalSessions = await prisma.session.count();
  const students = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { attendances: true } } }
  });
  return NextResponse.json({
    totalSessions,
    students: students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      fullName: s.fullName,
      points: s._count.attendances,
      createdAt: s.createdAt
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { fullName, password } = await req.json();
  if (!fullName || !password) {
    return NextResponse.json({ error: 'يرجى تعبئة جميع الحقول' }, { status: 400 });
  }

  const allStudents = await prisma.student.findMany({ select: { studentId: true } });
  let nextId = 1001;
  if (allStudents.length > 0) {
    const ids = allStudents.map(s => Number(s.studentId)).filter(n => !isNaN(n));
    if (ids.length > 0) {
      nextId = Math.max(...ids) + 1;
    }
  }
  const studentId = String(nextId);

  const passwordHash = await bcrypt.hash(String(password), 10);
  const s = await prisma.student.create({
    data: { studentId, fullName: String(fullName), passwordHash }
  });
  return NextResponse.json({ student: { id: s.id, studentId: s.studentId, fullName: s.fullName } });
}
