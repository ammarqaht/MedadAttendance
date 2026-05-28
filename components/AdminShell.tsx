'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Brand from './Brand';

const links = [
  { href: '/admin/dashboard',  label: 'الرئيسية' },
  { href: '/admin/attendance', label: 'جلسة التحضير' },
  { href: '/admin/reports',    label: 'التقارير' },
  { href: '/admin/students',   label: 'الطلاب' }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const r = await fetch('/api/session/start', { cache: 'no-store' });
        if (r.status === 401) { router.replace('/admin/login'); return; }
        const j = await r.json();
        const isLocked = !!j.session;
        if (cancelled) return;
        setLocked(isLocked);
        if (isLocked && path !== '/admin/attendance') {
          router.replace('/admin/attendance');
        }
      } catch {
        if (!cancelled) setLocked(false);
      }
    };
    checkSession();

    const onSessionChange = () => checkSession();
    window.addEventListener('session-change', onSessionChange);

    return () => { 
      cancelled = true; 
      window.removeEventListener('session-change', onSessionChange);
    };
  }, [path, router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-10 py-5 bg-white border-b border-ink-200 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Brand size="md" href={locked ? undefined : '/admin/dashboard'} />
          {!locked && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = path === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-gold/10 text-gold-500 font-medium'
                        : 'text-ink-500 hover:text-ink-900 hover:bg-cream-100'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          )}
          {locked && (
            <span className="hidden md:inline-flex items-center gap-2 text-xs text-gold-500 bg-gold/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              جلسة تحضير نشطة — أوقفها لاستخدام بقية الصفحات
            </span>
          )}
        </div>
        {!locked && (
          <button onClick={logout} className="btn btn-ghost text-sm">تسجيل الخروج</button>
        )}
      </header>

      {!locked && (
        <nav className="md:hidden px-4 py-3 bg-white border-b border-ink-200 flex gap-2 overflow-x-auto scroll-soft">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 px-3 py-1.5 rounded-md text-sm ${
                  active ? 'bg-gold/10 text-gold-500 font-medium' : 'text-ink-500'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}

      <main className="flex-1 px-4 md:px-10 py-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
