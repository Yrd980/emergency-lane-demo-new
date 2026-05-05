const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${body}`);
  }
  return resp.json();
}

export const api = {
  getStats: () =>
    request<import('../types').OverviewStats>('/stats/overview'),

  getEvents: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<import('../types').EventListResponse>(`/events?${qs}`);
  },

  getEvent: (id: string) =>
    request<import('../types').EventDetail>(`/events/${id}`),

  reviewEvent: (id: string, review_status: string, operator_note: string) =>
    request(`/events/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, operator_note }),
    }),

  getDevices: () =>
    request<import('../types').DeviceInfo[]>('/devices'),
};
