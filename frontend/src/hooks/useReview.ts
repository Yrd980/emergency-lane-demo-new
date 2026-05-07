import { useState } from 'react';
import { api } from '../api/client';

export function useReview(eventId: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (review_status: string, operator_note: string, operator_id: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.reviewEvent(eventId, review_status, operator_note, operator_id);
      return true;
    } catch (e: unknown) {
      setError((e as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, error };
}
