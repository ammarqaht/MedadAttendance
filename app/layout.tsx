import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'مداد تحضير — نظام التحضير الذكي',
  description: 'منصة تحضير ذكية تعتمد على رمز QR متجدد كل خمس ثوانٍ ولوحة تقارير حضور متكاملة.'
};

export const viewport: Viewport = {
  themeColor: '#FAFAF7',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preload" href="/fonts/title/thmanyahserifdisplay-Black.otf" as="font" type="font/otf" crossOrigin="" />
        <link rel="preload" href="/fonts/body/thmanyahsans-Light.otf" as="font" type="font/otf" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
