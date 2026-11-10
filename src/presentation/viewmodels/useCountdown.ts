import { useCallback, useEffect, useState } from 'react';

// Cuenta regresiva en segundos: vigencia del codigo y espera entre reenvios.
export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!endsAt || remaining === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt, remaining]);

  const start = useCallback((seconds: number) => {
    const startedAt = Date.now();
    setNow(startedAt);
    setEndsAt(startedAt + seconds * 1000);
  }, []);

  const stop = useCallback(() => setEndsAt(null), []);

  return { remaining, running: remaining > 0, start, stop };
}
