import { useEffect, useState } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number
): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetcher, intervalMs]);

  return { data, error };
}
