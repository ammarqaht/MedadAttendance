import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { id } = await params;
  const pk = Number(id);
  const { studentId, fullName, password } = await req.json();
  const data: any = {};
  if (studentId) data.studentId = String(studentId);
  if (fullName) data.fullName = String(fullName);
  if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
  try {
    const s = await prisma.student.update({ where: { id: pk }, data });
    return NextResponse.json({ student: { id: s.id, studentId: s.studentId, fullName: s.fullName } });
  } catch {
    return NextResponse.json({ error: 'تعذّر التحديث' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { id } = await params;
  const pk = Number(id);
  await prisma.student.delete({ where: { id: pk } });
  return NextResponse.json({ ok: true });
}
