import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { EventDetail } from '../types';

export function useEventDetail(id: string) {
  const [data, setData] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    api.getEvent(id)
      .then((d) => { setData(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  return { data, loading, error, refetch: fetch };
}
