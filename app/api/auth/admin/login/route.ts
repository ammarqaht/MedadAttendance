import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
  }
  const admin = await prisma.admin.findUnique({ where: { username: String(username) } });
  if (!admin || !(await bcrypt.compare(String(password), admin.passwordHash))) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }
  await setSessionCookie({
    role: 'admin',
    id: admin.id,
    username: admin.username,
    fullName: admin.fullName ?? admin.username
  });
  return NextResponse.json({ ok: true });
}
