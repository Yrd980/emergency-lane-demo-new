import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SuspectedIncidentDetail } from '../types';

export function useSuspectedIncidentDetail(id: string) {
  const [data, setData] = useState<SuspectedIncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    api.getSuspectedIncident(id)
      .then((d) => { setData(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { void Promise.resolve().then(fetch); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
