import Link from 'next/link';
import Brand from '@/components/Brand';

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between border-b border-ink-200/60">
        <Brand size="md" />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/student/login" className="btn btn-ghost">دخول الطالب</Link>
          <Link href="/admin/login" className="btn btn-secondary">دخول المشرف</Link>
        </nav>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(70rem 40rem at 50% 30%, rgba(184,134,11,0.06), transparent 60%), radial-gradient(60rem 40rem at 50% 80%, rgba(124,144,130,0.06), transparent 60%)'
          }}
        />
        <div className="relative max-w-3xl text-center">
          <Brand size="hero" />
          <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
            <Link href="/admin/login" className="btn btn-primary">
              دخول لوحة المشرف
            </Link>
            <Link href="/student/login" className="btn btn-secondary">
              دخول الطالب
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            {[
              { t: 'رمز QR آمن', d: 'يتجدد باستمرار لمنع التلاعب والتصوير.' },
              { t: 'تحضير يدوي', d: 'بإدخال رقم الطالب عند تعذر المسح.' },
              { t: 'تقارير متكاملة', d: 'إحصاءات وتصدير CSV / Excel بنقرة واحدة.' }
            ].map((c) => (
              <div key={c.t} className="card p-5">
                <div className="font-display font-bold text-lg mb-1.5 text-ink-900">{c.t}</div>
                <div className="text-sm text-ink-500 leading-relaxed">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-8 py-6 border-t border-ink-200/60 text-sm text-ink-400 flex items-center justify-between">
        <span>© ٢٠٢٦ مداد تحضير — جميع الحقوق محفوظة</span>
        <span className="font-display tracking-wide">صُمم بعناية</span>
      </footer>
    </main>
  );
}
