'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import ToastHost, { pushToast } from '@/components/Toast';

type CheckIn = { id?: number; studentId: string; fullName: string; method: string; checkedAt: string };
type ActiveSession = { id: number; title: string; startedAt: string; endedAt: string | null } | null;

export default function AdminAttendancePage() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [manualId, setManualId] = useState('');
  const [manualBusy, setManualBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Bootstrap: fetch current active session
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/session/start');
      if (r.status === 401) { router.push('/admin/login'); return; }
      const j = await r.json();
      if (j.session) {
        setSession(j.session);
        await loadCheckins(j.session.id);
      }
    })();
  }, [router]);

  // SSE subscription
  useEffect(() => {
    if (!session) return;
    const es = new EventSource(`/api/session/live?sessionId=${session.id}`);
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'check-in') {
          setCheckins((prev) =>
            prev.some((p) => p.studentId === msg.studentId)
              ? prev
              : [{ ...msg }, ...prev]
          );
          pushToast('success', `✓ تم تحضير: ${msg.fullName}`);
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => { /* auto-retry by EventSource */ };
    return () => { es.close(); esRef.current = null; };
  }, [session]);

  // QR token rotation every 5s
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function refresh() {
      const r = await fetch('/api/session/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session!.id })
      });
      if (!r.ok) return;
      const j = await r.json();
      if (cancelled) return;
      drawQR(JSON.stringify({ sessionId: j.sessionId, token: j.token }));
    }

    refresh();
    const intervalId = setInterval(refresh, 5000);

    return () => { cancelled = true; clearInterval(intervalId); };
  }, [session]);

  async function drawQR(payload: string) {
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      await QRCode.toCanvas(canvas, payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 360,
        color: { dark: '#1A1A1A', light: '#FFFFFF' }
      });
    } catch (e) {
      console.error('QR draw failed', e);
    }
  }

  async function loadCheckins(sid: number) {
    const r = await fetch(`/api/session/checkins?sessionId=${sid}`);
    if (r.ok) {
      const j = await r.json();
      setCheckins(j.items);
    }
  }

  async function startSession() {
    setStarting(true);
    const r = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `جلسة ${new Date().toLocaleString('ar-SA')}` })
    });
    setStarting(false);
    if (!r.ok) {
      setStarting(false);
      return pushToast('error', 'تعذّر بدء الجلسة');
    }
    const j = await r.json();
    setSession(j.session);
    setCheckins([]);
    setStarting(false);
    window.dispatchEvent(new Event('session-change'));
  }

  async function endSession() {
    if (!session) return;
    if (!confirm('هل تريد إنهاء الجلسة الحالية؟')) return;
    const r = await fetch('/api/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id })
    });
    if (!r.ok) return pushToast('error', 'تعذّر إنهاء الجلسة');
    pushToast('info', 'تم حفظ الجلسة وإنهاؤها');
    setSession(null);
    setCheckins([]);
    window.dispatchEvent(new Event('session-change'));
  }

  async function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !manualId.trim()) return;
    setManualBusy(true);
    const r = await fetch('/api/session/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, studentId: manualId.trim() })
    });
    setManualBusy(false);
    const j = await r.json();
    if (!r.ok) return pushToast('error', j.error ?? 'تعذّر التحضير');
    setManualId('');
    pushToast('success', `✓ تم تحضير: ${j.student.fullName}`);
    setCheckins(prev => {
      if (prev.some(p => p.studentId === j.student.studentId)) return prev;
      return [{
        studentId: j.student.studentId,
        fullName: j.student.fullName,
        method: 'manual',
        checkedAt: j.checkedAt
      }, ...prev];
    });
  }



  if (!session) {
    return (
      <AdminShell>
        <ToastHost />
        <div className="max-w-xl mx-auto card p-10 text-center fade-in">
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-3">لا توجد جلسة نشطة</h1>
          <p className="text-ink-500 mb-8">ابدأ جلسة جديدة لتوليد رمز QR متجدّد وفتح صفحة التحضير.</p>
          <button onClick={startSession} disabled={starting} className="btn btn-primary mx-auto">
            {starting ? '...' : 'بدء جلسة جديدة'}
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <ToastHost />
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">{session.title}</h1>
          <p className="text-sm text-ink-500">
            بدأت: {new Date(session.startedAt).toLocaleString('ar-SA')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={endSession} className="btn btn-danger">إنهاء وحفظ الجلسة</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* QR section */}
        <div className="card p-8">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-6">رمز QR</h2>
          <div className="relative mx-auto w-[360px] max-w-full aspect-square bg-white border border-gold/20 rounded-xl p-4 shadow-soft flex items-center justify-center">
            <canvas ref={qrCanvasRef} className="w-full h-full" />
          </div>
          <div className="mt-6 text-center">
            <div className="font-display font-bold text-3xl text-gold-500">{checkins.length}</div>
            <div className="text-sm text-ink-500 mt-1">طالب تم تحضيره في هذه الجلسة</div>
          </div>
        </div>

        {/* Manual entry */}
        <div className="card p-8">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-2">إدخال يدوي</h2>
          <p className="text-sm text-ink-500 mb-6">للحالات التي يتعذر فيها مسح الرمز.</p>
          <form onSubmit={manualSubmit} className="space-y-4">
            <div>
              <label className="label">رقم الطالب</label>
              <input
                className="field text-lg"
                dir="ltr"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="1001"
                autoFocus
              />
            </div>
            <button type="submit" disabled={manualBusy} className="btn btn-primary w-full">
              {manualBusy ? '...' : 'تحضير الطالب'}
            </button>
          </form>
          <div className="mt-8 text-center text-xs text-ink-400">
            ✦ يُقبل الرمز السابق لفترة قصيرة بعد التجديد لتجاوز التزامن اللحظي.
          </div>
        </div>
      </div>

      {/* Live table */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-lg text-ink-900 mb-4">
          الحاضرون الآن ({checkins.length})
        </h2>
        {checkins.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-8">لم يحضر أي طالب بعد.</p>
        ) : (
          <div className="overflow-x-auto scroll-soft">
            <table className="tbl">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>رقم الطالب</th>
                  <th>الوقت</th>
                  <th>الطريقة</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((c, i) => (
                  <tr key={i} className="fade-in">
                    <td className="font-medium">{c.fullName}</td>
                    <td className="text-ink-500 text-right font-mono" dir="ltr">{c.studentId}</td>
                    <td className="text-ink-500">{new Date(c.checkedAt).toLocaleTimeString('ar-SA')}</td>
                    <td>
                      {c.method === 'qr' ? (
                        <span className="text-xs text-gold-500 bg-gold/10 px-2 py-0.5 rounded">QR</span>
                      ) : (
                        <span className="text-xs text-sage-600 bg-sage-50 px-2 py-0.5 rounded">يدوي</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
