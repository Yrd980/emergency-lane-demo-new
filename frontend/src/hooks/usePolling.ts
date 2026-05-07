import { useCallback, useEffect, useRef, useState } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  refreshKey?: string,
): { data: T | null; error: string | null; loading: boolean; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const tick = useCallback(async (cancelled?: () => boolean) => {
    try {
      const result = await fetcherRef.current();
      if (!cancelled?.()) {
        setData(result);
        setError(null);
      }
    } catch (e: unknown) {
      if (!cancelled?.()) setError((e as Error).message);
    } finally {
      if (!cancelled?.()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void tick(() => cancelled);
    const id = setInterval(() => {
      void tick(() => cancelled);
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, tick]);

  useEffect(() => {
    if (refreshKey === undefined) return;
    let cancelled = false;
    void tick(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [refreshKey, tick]);

  const refetch = async () => {
    setLoading(true);
    await tick();
  };

  return { data, error, loading, refetch };
}
