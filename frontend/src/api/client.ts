import type {
  AuthUser,
  BulkReviewResponse,
  DeviceDetail,
  DeviceInfo,
  EventDetail,
  EventListResponse,
  OperationsStats,
  OverviewStats,
  RuntimeSettings,
  RuntimeSettingsUpdate,
  SystemStatus,
  TaskListResponse,
  TaskItem,
} from '../types';

const BASE_URL = '/api';
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(readableHttpError(resp.status, body));
  }
  return resp.json();
}

function readableHttpError(status: number, body: string) {
  if (status === 401) return '请先登录 Aegis Traffic';
  if (status === 403) return '当前账号没有权限执行该操作';
  if (status === 404) return '资源不存在，请返回列表刷新后再试';
  if (status >= 500) return '本地后端暂时不可用，请检查服务日志';
  if (status === 0) return '无法连接到本地后端';
  return `请求失败 (${status})${body ? `: ${body.slice(0, 160)}` : ''}`;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<AuthUser>('/auth/me'),

  getAssignableUsers: () => request<AuthUser[]>('/auth/assignees'),

  logout: () => request<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),

  getSystemStatus: () => request<SystemStatus>('/system/status'),

  getStats: () => request<OverviewStats>('/stats/overview'),

  getOperationsStats: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<OperationsStats>(`/stats/operations${qs ? `?${qs}` : ''}`);
  },

  getEvents: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<EventListResponse>(`/events?${qs}`);
  },

  getEvent: (id: string) => request<EventDetail>(`/events/${id}`),

  reviewEvent: (id: string, review_status: string, operator_note: string, operator_id?: string) =>
    request(`/events/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, operator_note, operator_id }),
    }),

  bulkReviewEvents: (event_ids: string[], review_status: string, operator_note: string, operator_id: string) =>
    request<BulkReviewResponse>('/events/review/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ event_ids, review_status, operator_note, operator_id }),
    }),

  assignEvent: (id: string, body: { assigned_to_username?: string; assigned_to_device_id?: string; note?: string }) =>
    request<TaskItem>(`/events/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTasks: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<TaskListResponse>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  acceptTask: (taskId: string) => request<TaskItem>(`/tasks/${taskId}/accept`, { method: 'POST' }),

  completeTask: (taskId: string, completed_note: string) =>
    request<TaskItem>(`/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completed_note }),
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
