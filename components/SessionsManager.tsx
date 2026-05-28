'use client';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import ToastHost, { pushToast } from './Toast';

export type SessionItem = {
  id: number;
  title: string;
  startedAt: string;
  endedAt: string | null;
  count: number;
};

export default function SessionsManager({ initialSessions }: { initialSessions: SessionItem[] }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);

  async function reopen(id: number) {
    if (!confirm('إعادة فتح هذه الجلسة كجلسة نشطة؟ سيتم إنهاء أي جلسة نشطة أخرى.')) return;
    const r = await fetch('/api/session/reopen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id })
    });
    if (!r.ok) { pushToast('error', 'تعذّر إعادة الفتح'); return; }
    pushToast('success', 'تم إعادة الفتح — الانتقال إلى صفحة التحضير');
    router.push('/admin/attendance');
  }

  async function addAttendance(id: number) {
    if (!studentId.trim()) return;
    setBusy(true);
    const r = await fetch('/api/session/manual', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id, studentId: studentId.trim() })
    });
    setBusy(false);
    const j = await r.json();
    if (!r.ok) { pushToast('error', j.error ?? 'فشل'); return; }
    pushToast('success', `✓ سُجّل حضور: ${j.student.fullName}`);
    setStudentId('');
    setAddingFor(null);
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, count: s.count + 1 } : s));
  }

  return (
    <div className="card p-6">
      <ToastHost />
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg text-ink-900">كل الجلسات</h2>
        <span className="text-xs text-ink-400">{sessions.length} جلسة</span>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-8">لا توجد جلسات بعد. ابدأ جلسة من صفحة التحضير.</p>
      ) : (
        <div className="overflow-x-auto scroll-soft">
          <table className="tbl">
            <thead>
              <tr>
                <th>الجلسة</th>
                <th>التاريخ</th>
                <th>الحضور</th>
                <th>الحالة</th>
                <th className="text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td className="font-medium">{s.title}</td>
                    <td className="text-ink-500 text-sm">{new Date(s.startedAt).toLocaleString('ar-SA')}</td>
                    <td>{s.count}</td>
                    <td>
                      {s.endedAt
                        ? <span className="text-xs text-ink-500 bg-cream-100 px-2 py-0.5 rounded">منتهية</span>
                        : <span className="text-xs text-sage-600 bg-sage-50 px-2 py-0.5 rounded">نشطة</span>}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-start">
                        <button
                          onClick={() => { setAddingFor(addingFor === s.id ? null : s.id); setStudentId(''); }}
                          className="btn btn-secondary py-1 px-3 text-xs"
                        >
                          {addingFor === s.id ? 'إلغاء' : 'إضافة حضور'}
                        </button>
                        {s.endedAt && (
                          <button onClick={() => reopen(s.id)} className="btn btn-primary py-1 px-3 text-xs">
                            إعادة فتح
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {addingFor === s.id && (
                    <tr className="fade-in">
                      <td colSpan={5} className="bg-cream-100/60">
                        <div className="flex gap-2 items-end max-w-md">
                          <div className="flex-1">
                            <label className="label">رقم الطالب</label>
                            <input
                              className="field" dir="ltr" autoFocus
                              value={studentId}
                              onChange={(e) => setStudentId(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') addAttendance(s.id); }}
                              placeholder="1001"
                            />
                          </div>
                          <button onClick={() => addAttendance(s.id)} disabled={busy} className="btn btn-primary py-2 px-4 text-sm">
                            تسجيل
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
