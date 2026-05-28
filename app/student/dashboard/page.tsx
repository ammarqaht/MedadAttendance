'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Brand from '@/components/Brand';
import ToastHost from '@/components/Toast';
import StudentScanner from '@/components/StudentScanner';

type Me = {
  me: { id: number; studentId: string; fullName: string };
  points: number;
  totalSessions: number;
  pct: number;
  activeSessionId: number | null;
  log: { id: number; title: string; method: string; checkedAt: string }[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error('Error fetching data');
  return res.json();
};

export default function StudentDashboard() {
  const router = useRouter();
  const [scanOpen, setScanOpen] = useState(false);
  const { data, error, mutate } = useSWR<Me>('/api/student/me', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (error) router.push('/student/login');
  }, [error, router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/student/login');
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => logout(), 60000);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, []);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-ink-500">...</div>;

  const firstName = data.me.fullName.split(' ')[0];

  return (
    <div className="min-h-screen">
      <ToastHost />

      <header className="px-5 md:px-10 py-5 bg-white border-b border-ink-200 flex items-center justify-between">
        <Brand size="md" />
        <button onClick={logout} className="btn btn-ghost text-sm">خروج</button>
      </header>

      <main className="px-5 md:px-10 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-ink-900 mb-1">
            أهلًا {firstName} 👋
          </h1>
          <p className="text-ink-500">تابع نقاط حضورك وسجّل تحضيرك بسهولة.</p>
        </div>

        <div className="card p-7 mb-6 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(20rem 12rem at 90% 0%, rgba(184,134,11,0.08), transparent)' }}
          />
          <div className="relative">
            <div className="text-sm text-ink-500 mb-2">نقاط الحضور</div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display font-black text-7xl text-gold-500">{data.points}</span>
              <span className="text-ink-400 text-lg">/ {data.totalSessions}</span>
            </div>
            <div className="h-2 bg-cream-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-l from-gold to-gold-400 transition-all duration-500"
                style={{ width: `${data.pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-500">
              <span>نسبة الحضور</span>
              <span className="font-medium text-ink-900">{data.pct}%</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setScanOpen(true)}
          className="btn btn-primary w-full text-lg py-4 mb-8"
          disabled={!data.activeSessionId}
        >
          <span className="text-xl">⌬</span>
          {data.activeSessionId ? 'مسح رمز QR للتحضير' : 'لا توجد جلسة نشطة'}
        </button>

        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-4">سجل الحضور</h2>
          {data.log.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-8">لم تسجّل حضورًا بعد.</p>
          ) : (
            <div className="space-y-2">
              {data.log.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-cream-100 transition-colors">
                  <div>
                    <div className="font-medium text-ink-900">{a.title}</div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {new Date(a.checkedAt).toLocaleString('ar-SA')}
                    </div>
                  </div>
                  {a.method === 'qr' ? (
                    <span className="text-xs text-gold-500 bg-gold/10 px-2 py-1 rounded">QR</span>
                  ) : (
                    <span className="text-xs text-sage-600 bg-sage-50 px-2 py-1 rounded">يدوي</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {scanOpen && (
        <StudentScanner
          onClose={() => setScanOpen(false)}
          onSuccess={() => { setScanOpen(false); mutate(); }}
        />
      )}
    </div>
  );
}
