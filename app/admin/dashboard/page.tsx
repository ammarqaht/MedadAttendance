import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import AdminShell from '@/components/AdminShell';
import SessionsManager from '@/components/SessionsManager';
import QuickLinks from '@/components/QuickLinks';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const me = await getSession();
  if (!me || me.role !== 'admin') redirect('/admin/login');

  // Server-side lock: if any session is active, the admin must go to the attendance page first.
  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: 'desc' }
  });
  if (activeSession) redirect('/admin/attendance');

  const [totalStudents, totalSessions, totalAttendances] = await Promise.all([
    prisma.student.count(),
    prisma.session.count(),
    prisma.attendance.count()
  ]);

  const sessions = await prisma.session.findMany({
    orderBy: { startedAt: 'desc' },
    include: { _count: { select: { attendances: true } } }
  });

  const stat = (label: string, value: number | string, hint?: string) => (
    <div className="card p-6">
      <div className="text-sm text-ink-500 mb-2">{label}</div>
      <div className="font-display font-bold text-4xl text-ink-900">{value}</div>
      {hint && <div className="text-xs text-ink-400 mt-2">{hint}</div>}
    </div>
  );

  return (
    <AdminShell>
      <div className="mb-10">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-1.5">
          أهلًا، {me.fullName ?? me.username}
        </h1>
        <p className="text-ink-500">لمحة سريعة عن المنصة وكل الجلسات.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stat('إجمالي الطلاب', totalStudents)}
        {stat('إجمالي الجلسات', totalSessions)}
        {stat('إجمالي عمليات التحضير', totalAttendances)}
      </div>

      <QuickLinks />

      <SessionsManager
        initialSessions={sessions.map((s) => ({
          id: s.id,
          title: s.title,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt?.toISOString() ?? null,
          count: s._count.attendances
        }))}
      />
    </AdminShell>
  );
}
