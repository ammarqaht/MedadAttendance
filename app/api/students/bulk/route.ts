import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Papa from 'papaparse';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

type Row = { studentId?: string; fullName?: string; password?: string; name?: string; id?: string };

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 });

  const parsed = Papa.parse<Row>(String(csv).trim(), { header: true, skipEmptyLines: true });
  let inserted = 0, skipped = 0;
  for (const r of parsed.data) {
    const studentId = (r.studentId ?? r.id ?? '').toString().trim();
    const fullName = (r.fullName ?? r.name ?? '').toString().trim();
    const password = (r.password ?? '1234').toString();
    if (!studentId || !fullName) { skipped++; continue; }
    try {
      const hash = await bcrypt.hash(password, 10);
      await prisma.student.create({ data: { studentId, fullName, passwordHash: hash } });
      inserted++;
    } catch {
      skipped++;
    }
  }
  return NextResponse.json({ inserted, skipped });
}
