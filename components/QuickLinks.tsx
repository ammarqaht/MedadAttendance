import Link from 'next/link';

export default function QuickLinks() {
  const items = [
    { href: '/admin/attendance', t: 'ابدأ جلسة تحضير', d: 'رمز QR + إدخال يدوي + متابعة لحظية.' },
    { href: '/admin/reports',    t: 'التقارير',         d: 'جدول طلاب × جلسات مع نسب الحضور والتصدير.' },
    { href: '/admin/students',   t: 'الطلاب',           d: 'إضافة فردية، استيراد CSV، تعديل وحذف.' }
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
      {items.map((c) => (
        <Link key={c.href} href={c.href} className="card p-6 hover:shadow-elevated transition-all group">
          <div className="text-gold-500 text-sm font-medium mb-2">{c.t}</div>
          <div className="text-sm text-ink-500">{c.d}</div>
          <div className="mt-4 text-sm text-gold-500 group-hover:translate-x-[-4px] transition-transform inline-flex items-center gap-1">
            افتح ←
          </div>
        </Link>
      ))}
    </div>
  );
}
