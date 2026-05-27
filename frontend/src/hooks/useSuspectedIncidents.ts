import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { SuspectedIncidentListResponse } from '../types';

export function useSuspectedIncidents(initialFilters?: Record<string, string>) {
  const [data, setData] = useState<SuspectedIncidentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    limit: '50',
    offset: '0',
    ...initialFilters,
  });

  const fetchSuspectedIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getSuspectedIncidents(filters);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void Promise.resolve().then(fetchSuspectedIncidents);
  }, [fetchSuspectedIncidents]);

  return { data, loading, error, filters, setFilters, refetch: fetchSuspectedIncidents };
}
