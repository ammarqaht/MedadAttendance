'use client';
import { useEffect, useRef, useState } from 'react';
import { pushToast } from './Toast';

type Props = { onClose: () => void; onSuccess: () => void };

export default function StudentScanner({ onClose, onSuccess }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [status, setStatus] = useState<string>('جاري تشغيل الكاميرا...');
  const lastTokenRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('html5-qrcode');
        const Html5Qrcode = (mod as any).Html5Qrcode;
        if (!ref.current) return;
        const scanner = new Html5Qrcode(ref.current.id);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decoded: string) => {
            if (cancelled) return;
            if (lastTokenRef.current === decoded) return;
            lastTokenRef.current = decoded;
            let payload: any;
            try { payload = JSON.parse(decoded); } catch { setStatus('رمز غير صالح'); return; }
            if (!payload?.sessionId || !payload?.token) { setStatus('رمز غير صالح'); return; }

            setStatus('جاري التحضير...');
            const r = await fetch('/api/attendance/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: payload.sessionId, token: payload.token })
            });
            const j = await r.json();
            if (r.ok) {
              pushToast('success', 'تم تسجيل حضورك ✓');
              try { await scanner.stop(); } catch {}
              onSuccess();
            } else {
              pushToast('error', j.error ?? 'تعذّر التحضير');
              setStatus(j.error ?? 'حاول مجددًا');
              setTimeout(() => { lastTokenRef.current = ''; }, 1200);
            }
          },
          () => { /* per-frame fail = noisy, ignore */ }
        );
        setStatus('وجّه الكاميرا نحو الرمز');
      } catch (e: any) {
        setStatus('تعذّر الوصول إلى الكاميرا — تحقق من الإذن');
      }
    })();
    return () => {
      cancelled = true;
      (async () => {
        try { await scannerRef.current?.stop(); } catch {}
        try { scannerRef.current?.clear(); } catch {}
      })();
    };
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-[9998] bg-ink-900/85 flex items-center justify-center p-4 fade-in">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-ink-200">
          <h3 className="font-display font-bold text-lg">مسح رمز QR</h3>
          <button onClick={onClose} className="btn btn-ghost text-sm">إغلاق</button>
        </div>
        <div id="qr-region" ref={ref} className="aspect-square bg-black" />
        <div className="p-4 text-center text-sm text-ink-500">{status}</div>
      </div>
    </div>
  );
}
