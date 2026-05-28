'use client';
import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastMsg = { id: number; kind: ToastKind; text: string };

let _id = 0;
const listeners = new Set<(t: ToastMsg) => void>();

export function pushToast(kind: ToastKind, text: string) {
  const msg = { id: ++_id, kind, text };
  listeners.forEach((fn) => fn(msg));
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const onMsg = (t: ToastMsg) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.add(onMsg);
    return () => { listeners.delete(onMsg); };
  }, []);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast pointer-events-auto px-5 py-3 rounded-lg shadow-elevated border text-sm font-medium ${
            t.kind === 'success'
              ? 'bg-sage-50 border-sage/30 text-sage-600'
              : t.kind === 'error'
              ? 'bg-rose-50 border-rose-muted/30 text-rose-muted'
              : 'bg-white border-ink-200 text-ink-800'
          }`}
        >
          <span className="ml-2">
            {t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : 'ⓘ'}
          </span>
          {t.text}
        </div>
      ))}
    </div>
  );
}
