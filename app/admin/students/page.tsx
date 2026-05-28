'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import ToastHost, { pushToast } from '@/components/Toast';

type S = { id: number; studentId: string; fullName: string; points: number; createdAt: string };

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<S[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fullName: '', password: '1234' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ studentId: '', fullName: '', password: '' });
  const [csv, setCsv] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch('/api/students');
    if (r.status === 401) { router.push('/admin/login'); return; }
    const j = await r.json();
    setStudents(j.students);
    setTotalSessions(j.totalSessions);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const r = await fetch('/api/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setAdding(false);
    const j = await r.json();
    if (!r.ok) return pushToast('error', j.error ?? 'فشل');
    pushToast('success', 'تمت إضافة الطالب');
    setForm({ fullName: '', password: '1234' });
    load();
  }

  async function saveEdit(id: number) {
    const r = await fetch(`/api/students/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: editForm.studentId || undefined,
        fullName: editForm.fullName || undefined,
        password: editForm.password || undefined
      })
    });
    if (!r.ok) return pushToast('error', 'فشل التحديث');
    setEditId(null);
    pushToast('success', 'تم التحديث');
    load();
  }

  async function del(id: number) {
    if (!confirm('حذف الطالب نهائيًا؟')) return;
    const r = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!r.ok) return pushToast('error', 'فشل الحذف');
    pushToast('info', 'تم الحذف');
    load();
  }

  async function importCsv() {
    if (!csv.trim()) return;
    const r = await fetch('/api/students/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv })
    });
    const j = await r.json();
    if (!r.ok) return pushToast('error', j.error ?? 'فشل الاستيراد');
    pushToast('success', `تم استيراد ${j.inserted} طالب (تم تخطي ${j.skipped})`);
    setCsv('');
    setCsvOpen(false);
    load();
  }

  const filtered = students.filter(
    (s) => !search || s.fullName.includes(search) || s.studentId.includes(search)
  );

  return (
    <AdminShell>
      <ToastHost />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">الطلاب</h1>
          <p className="text-sm text-ink-500">إضافة، تعديل، حذف، واستيراد من CSV.</p>
        </div>
        <button onClick={() => setCsvOpen(!csvOpen)} className="btn btn-secondary">
          {csvOpen ? 'إغلاق' : 'استيراد CSV'}
        </button>
      </div>

      {csvOpen && (
        <div className="card p-6 mb-6 fade-in">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-1">استيراد من ملف CSV</h2>
          <p className="text-sm text-ink-500 mb-4">
            الأعمدة المطلوبة: <code className="bg-cream-100 px-1.5 py-0.5 rounded text-xs">studentId,fullName,password</code>.
            عمود كلمة المرور اختياري — الافتراضي <code className="bg-cream-100 px-1.5 py-0.5 rounded text-xs">1234</code>.
          </p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="field font-mono text-sm"
            rows={8}
            dir="ltr"
            placeholder={`studentId,fullName,password\n2001,محمد سعيد,1234\n2002,فاطمة الزهراني,abcd`}
          />
          <div className="mt-4 flex gap-2">
            <button onClick={importCsv} className="btn btn-primary">استيراد</button>
            <button onClick={() => { setCsv(''); setCsvOpen(false); }} className="btn btn-ghost">إلغاء</button>
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <h2 className="font-display font-bold text-lg text-ink-900 mb-4">إضافة طالب</h2>
        <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">الاسم الكامل</label>
            <input className="field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="الاسم الكامل" />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <div className="flex gap-2">
              <input className="field flex-1" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button 
                type="button" 
                onClick={() => setForm({ ...form, password: Math.floor(10000 + Math.random() * 90000).toString() })} 
                className="btn btn-secondary px-3"
              >
                توليد
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={adding} className="btn btn-primary w-full">
              {adding ? '...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display font-bold text-lg text-ink-900">
            القائمة ({filtered.length}{search ? ` / ${students.length}` : ''})
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field max-w-xs"
            placeholder="بحث بالاسم أو الرقم..."
          />
        </div>
        {loading ? (
          <p className="text-center py-8 text-ink-500 text-sm">...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-ink-500 text-sm">لا يوجد طلاب يطابقون البحث.</p>
        ) : (
          <div className="overflow-x-auto scroll-soft">
            <table className="tbl">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الطالب</th>
                  <th>النقاط</th>
                  <th>النسبة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pct = totalSessions ? Math.round((s.points / totalSessions) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        {editId === s.id ? (
                          <input className="field" defaultValue={s.fullName}
                                 onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                        ) : <span className="font-medium">{s.fullName}</span>}
                      </td>
                      <td dir="ltr" className="text-ink-500 text-right font-mono">
                        {editId === s.id ? (
                          <input className="field text-right" dir="ltr" defaultValue={s.studentId}
                                 onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })} />
                        ) : s.studentId}
                      </td>
                      {editId === s.id ? (
                        <td colSpan={2}>
                          <input 
                            className="field text-sm" 
                            dir="ltr" 
                            placeholder="تغيير كلمة المرور (اختياري)"
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} 
                          />
                        </td>
                      ) : (
                        <>
                          <td>{s.points}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gold" style={{ width: pct + '%' }} />
                              </div>
                              <span className="text-xs text-ink-500">{pct}%</span>
                            </div>
                          </td>
                        </>
                      )}
                      <td>
                        <div className="flex gap-2">
                          {editId === s.id ? (
                            <>
                              <button onClick={() => saveEdit(s.id)} className="btn btn-primary py-1 px-3 text-xs">حفظ</button>
                              <button onClick={() => setEditId(null)} className="btn btn-ghost py-1 px-3 text-xs">إلغاء</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditId(s.id); setEditForm({ studentId: s.studentId, fullName: s.fullName, password: '' }); }} className="btn btn-secondary py-1 px-3 text-xs">تعديل</button>
                              <button onClick={() => del(s.id)} className="btn btn-danger py-1 px-3 text-xs">حذف</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
