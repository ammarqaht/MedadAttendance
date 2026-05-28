'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from '@/components/Brand';

export default function StudentLogin() {
  const router = useRouter();
  const [id, setId] = useState('1001');
  const [pw, setPw] = useState('1234');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/auth/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id, password: pw })
    });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error ?? 'فشل'); return; }
    router.push('/student/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(50rem 30rem at 50% 30%, rgba(124,144,130,0.07), transparent)' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Brand size="lg" />
          <p className="mt-4 text-ink-500 text-sm">بوابة الطالب</p>
        </div>
        <form onSubmit={submit} className="card p-8 space-y-5">
          <h1 className="text-2xl font-display font-bold text-ink-900 mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-ink-500 -mt-1 mb-4">استخدم رقم الطالب وكلمة المرور.</p>

          <div>
            <label className="label">رقم الطالب</label>
            <input className="field text-lg" dir="ltr" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>

          {err && <div className="text-sm text-rose-muted bg-rose-50 border border-rose-muted/20 rounded-md p-3">{err}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? '...' : 'دخول'}
          </button>

          <p className="text-xs text-ink-400 text-center pt-4 border-t border-ink-200">
            بيانات تجريبية: 1001 / 1234
          </p>
        </form>
      </div>
    </div>
  );
}
