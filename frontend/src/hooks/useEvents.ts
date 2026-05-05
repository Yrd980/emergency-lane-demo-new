import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { EventListResponse } from '../types';

export function useEvents() {
  const [data, setData] = useState<EventListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    limit: '50',
    offset: '0',
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getEvents(filters);
      setData(result);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { data, loading, error, filters, setFilters, refetch: fetchEvents };
}
