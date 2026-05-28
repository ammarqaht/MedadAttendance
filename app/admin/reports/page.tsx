'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';

type Report = {
  sessions: { id: number; title: string; startedAt: string; endedAt: string | null }[];
  grid: { id: number; fullName: string; studentId: string; cells: boolean[]; points: number; pct: number }[];
  stats: {
    totalSessions: number;
    totalStudents: number;
    avgRate: number;
    top: { fullName: string; studentId: string; points: number; pct: number }[];
    bottom: { fullName: string; studentId: string; points: number; pct: number }[];
  };
};

// ============================================================
// Week helpers — week starts Saturday (Hijri/Arabic convention)
// ============================================================
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 1) % 7; // days since Saturday
  d.setDate(d.getDate() - offset);
  return d;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
}
function fmtYmd(d: Date): string {
  // local ISO date YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}
const DAY_NAMES = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export default function ReportsPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [data, setData] = useState<Report | null>(null);
  const [student, setStudent] = useState('');
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(true);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set('from', fmtYmd(weekStart));
    qs.set('to', fmtYmd(weekEnd));
    if (student) qs.set('student', student);
    if (method) qs.set('method', method);
    const r = await fetch('/api/reports?' + qs.toString());
    if (r.status === 401) { router.push('/admin/login'); return; }
    const j = await r.json();
    setData(j);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [weekStart]);

  function exportCsv() {
    const qs = new URLSearchParams();
    qs.set('from', fmtYmd(weekStart));
    qs.set('to', fmtYmd(weekEnd));
    window.open('/api/reports/export?' + qs.toString(), '_blank');
  }

  // Build a 7-day frame keyed by day index 0..6 (Sat..Fri)
  const sessionByDay = useMemo(() => {
    const map = new Map<number, Report['sessions'][number]>();
    if (!data) return map;
    for (const s of data.sessions) {
      const sd = new Date(s.startedAt);
      sd.setHours(0, 0, 0, 0);
      const idx = Math.round((sd.getTime() - weekStart.getTime()) / 86400000);
      if (idx >= 0 && idx <= 6) map.set(idx, s);
    }
    return map;
  }, [data, weekStart]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIdx = Math.round((today.getTime() - weekStart.getTime()) / 86400000);
  const isCurrentWeek = todayIdx >= 0 && todayIdx <= 6;

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">التقارير</h1>
          <p className="text-sm text-ink-500">عرض أسبوعي لحضور الطلاب — جلسة واحدة لكل يوم.</p>
        </div>
        <button onClick={exportCsv} className="btn btn-secondary">تصدير CSV</button>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">طالب (اسم أو رقم)</label>
            <input className="field" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="بحث..." />
          </div>
          <div>
            <label className="label">الطريقة</label>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">الكل</option>
              <option value="qr">QR</option>
              <option value="manual">يدوي</option>
            </select>
          </div>
          <button onClick={load} className="btn btn-primary w-full">تطبيق</button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-6">
              <div className="text-sm text-ink-500 mb-2">جلسات الأسبوع</div>
              <div className="font-display font-bold text-4xl text-ink-900">{data.stats.totalSessions}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-ink-500 mb-2">إجمالي الطلاب</div>
              <div className="font-display font-bold text-4xl text-ink-900">{data.stats.totalStudents}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-ink-500 mb-2">متوسط حضور الأسبوع</div>
              <div className="font-display font-bold text-4xl text-gold-500">{data.stats.avgRate}%</div>
            </div>
          </div>

          <div className="card p-6">
            {/* Week navigator */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-display font-bold text-lg">جدول الحضور الأسبوعي</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  aria-label="الأسبوع السابق"
                  className="btn btn-secondary w-10 h-10 p-0 rounded-full"
                  title="الأسبوع السابق"
                >
                  →
                </button>
                <div className="text-center min-w-[260px]">
                  <div className="font-display font-bold text-base text-ink-900">
                    {fmtDate(weekStart)} - {fmtDate(weekEnd)}
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {isCurrentWeek
                      ? 'الأسبوع الحالي'
                      : weekEnd < today
                        ? 'أسبوع سابق'
                        : 'أسبوع قادم'}
                  </div>
                </div>
                <button
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  aria-label="الأسبوع التالي"
                  className="btn btn-secondary w-10 h-10 p-0 rounded-full"
                  title="الأسبوع التالي"
                >
                  ←
                </button>
                {!isCurrentWeek && (
                  <button
                    onClick={() => setWeekStart(startOfWeek(new Date()))}
                    className="btn btn-ghost text-xs"
                  >
                    اليوم
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-center py-8 text-ink-500 text-sm">...</p>
            ) : data.grid.length === 0 ? (
              <p className="text-center py-8 text-ink-500 text-sm">لا يوجد طلاب.</p>
            ) : (
              <div className="grid-table-wrap overflow-x-auto scroll-soft">
                <table className="grid-tbl">
                  <thead>
                    <tr>
                      <th className="stick-right header-bg">الطالب</th>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const day = addDays(weekStart, i);
                        const sess = sessionByDay.get(i);
                        const isToday = i === todayIdx;
                        return (
                          <th
                            key={i}
                            className={`grid-col text-center header-bg ${isToday ? 'today-col' : ''}`}
                            title={sess ? sess.title : 'لا جلسة'}
                          >
                            <div className="font-display font-bold text-sm text-ink-900">
                              {DAY_NAMES[i]}
                            </div>
                            <div className="text-[10px] text-ink-400 font-normal mt-0.5">
                              {day.toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit' })}
                            </div>
                          </th>
                        );
                      })}
                      <th className="stick-left text-center header-bg w-20">النقاط</th>
                      <th className="stick-left-2 text-center header-bg w-20">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grid.map((row) => {
                      // Per-day cell array: present/absent/no-session
                      const dayCells = Array.from({ length: 7 }).map((_, i) => {
                        const sess = sessionByDay.get(i);
                        if (!sess) return 'none' as const;
                        const sessionIndex = data.sessions.findIndex((s) => s.id === sess.id);
                        return row.cells[sessionIndex] ? 'present' : 'absent';
                      });
                      const points = dayCells.filter((c) => c === 'present').length;
                      const totalInWeek = dayCells.filter((c) => c !== 'none').length;
                      const pct = totalInWeek ? Math.round((points / totalInWeek) * 100) : 0;
                      return (
                        <tr key={row.id}>
                          <td className="stick-right">
                            <div className="font-medium text-sm">{row.fullName}</div>
                            <div className="text-xs text-ink-400" dir="ltr">{row.studentId}</div>
                          </td>
                          {dayCells.map((c, i) => (
                            <td key={i} className={`grid-col text-center ${i === todayIdx ? 'today-col' : ''}`}>
                              {c === 'present' && <span className="text-sage-600 text-lg">✓</span>}
                              {c === 'absent' && <span className="text-rose-muted/70 text-lg">✗</span>}
                              {c === 'none' && <span className="text-ink-300">—</span>}
                            </td>
                          ))}
                          <td className="stick-left text-center font-medium">{points}{totalInWeek ? `/${totalInWeek}` : ''}</td>
                          <td className="stick-left-2 text-center">
                            {totalInWeek === 0 ? (
                              <span className="text-ink-300 text-sm">—</span>
                            ) : (
                              <span className={`text-sm font-medium ${
                                pct >= 70 ? 'text-sage-600' : pct >= 40 ? 'text-gold-500' : 'text-rose-muted'
                              }`}>{pct}%</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-5 text-xs text-ink-400 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><span className="text-sage-600">✓</span> حاضر</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-rose-muted/70">✗</span> غائب</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-ink-300">—</span> لا جلسة</span>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
