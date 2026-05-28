'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Brand from '@/components/Brand';

export default function AdminLogin() {
  const router = useRouter();
  const [u, setU] = useState('ammar');
  const [p, setP] = useState('1234');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error ?? 'فشل تسجيل الدخول'); return; }
    router.push('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(50rem 30rem at 50% 30%, rgba(184,134,11,0.06), transparent)' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Brand size="lg" />
          <p className="mt-4 text-ink-500 text-sm">لوحة المشرف</p>
        </div>
        <form onSubmit={submit} className="card p-8 space-y-5">
          <h1 className="text-2xl font-display font-bold text-ink-900 mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-ink-500 -mt-1 mb-4">أدخل بيانات حساب المشرف للمتابعة.</p>

          <div>
            <label className="label">اسم المستخدم</label>
            <input className="field" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input className="field" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
          </div>

          {err && <div className="text-sm text-rose-muted bg-rose-50 border border-rose-muted/20 rounded-md p-3">{err}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? '...' : 'دخول'}
          </button>

          <p className="text-xs text-ink-400 text-center pt-4 border-t border-ink-200">
            البيانات الافتراضية: ammar / 1234
          </p>
        </form>
      </div>
    </div>
  );
}
