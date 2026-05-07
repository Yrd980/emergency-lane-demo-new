import type {
  DeviceDetail,
  DeviceInfo,
  EventDetail,
  EventListResponse,
  OverviewStats,
  RuntimeSettings,
  RuntimeSettingsUpdate,
  SystemStatus,
} from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(readableHttpError(resp.status, body));
  }
  return resp.json();
}

function readableHttpError(status: number, body: string) {
  if (status === 404) return '资源不存在，请返回列表刷新后再试';
  if (status >= 500) return '本地后端暂时不可用，请检查服务日志';
  if (status === 0) return '无法连接到本地后端';
  return `请求失败 (${status})${body ? `: ${body.slice(0, 160)}` : ''}`;
}

export const api = {
  getSystemStatus: () => request<SystemStatus>('/system/status'),

  getStats: () => request<OverviewStats>('/stats/overview'),

  getEvents: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<EventListResponse>(`/events?${qs}`);
  },

  getEvent: (id: string) => request<EventDetail>(`/events/${id}`),

  reviewEvent: (id: string, review_status: string, operator_note: string, operator_id: string) =>
    request(`/events/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, operator_note, operator_id }),
    }),

  getDevices: () => request<DeviceInfo[]>('/devices'),

  getDevice: (id: string) => request<DeviceDetail>(`/devices/${id}`),

  getSettings: () => request<RuntimeSettings>('/settings'),

  updateSettings: (body: RuntimeSettingsUpdate) =>
    request<RuntimeSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
