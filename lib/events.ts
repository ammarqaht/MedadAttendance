type Listener = (payload: any) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribe(channel: string, fn: Listener) {
  let set = channels.get(channel);
  if (!set) { set = new Set(); channels.set(channel, set); }
  set.add(fn);
  return () => { set!.delete(fn); if (set!.size === 0) channels.delete(channel); };
}

export function publish(channel: string, payload: any) {
  const set = channels.get(channel);
  if (!set) return;
  for (const fn of set) {
    try { fn(payload); } catch { /* ignore listener errors */ }
  }
}

export function sessionChannel(sessionId: number) {
  return `session:${sessionId}`;
}
