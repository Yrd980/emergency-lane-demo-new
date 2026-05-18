export type Role = 'admin' | 'reviewer' | 'dispatcher' | 'patrol';
export type Permission =
  | 'suspected_incidents:read'
  | 'suspected_incidents:review'
  | 'suspected_incidents:assign'
  | 'suspected_incidents:delete'
  | 'tasks:read'
  | 'tasks:accept'
  | 'tasks:complete'
  | 'devices:read'
  | 'settings:read'
  | 'settings:write'
  | 'stats:read';

export const roleLabels: Record<Role, string> = {
  admin: '管理员',
  reviewer: '审核员',
  dispatcher: '调度员',
  patrol: '巡逻员',
};

export const navItems = [
  { to: '/', label: '总览', icon: 'dashboard', permissions: ['stats:read'] as Permission[] },
  { to: '/review', label: '审核队列', icon: 'fact_check', permissions: ['suspected_incidents:review'] as Permission[] },
  { to: '/suspected-incidents', label: '疑似事件日志', icon: 'emergency', permissions: ['suspected_incidents:read'] as Permission[] },
  { to: '/devices', label: '设备', icon: 'sensors', permissions: ['devices:read'] as Permission[] },
  { to: '/health', label: '健康状态', icon: 'monitoring', permissions: ['devices:read'] as Permission[] },
  { to: '/settings', label: '设置', icon: 'settings', permissions: ['settings:read'] as Permission[] },
  { to: '/setup', label: '配置向导', icon: 'add_circle', permissions: ['devices:read'] as Permission[] },
] as const;

export const routeAccess = {
  dashboard: ['stats:read'] as Permission[],
  setup: ['devices:read'] as Permission[],
  review: ['suspected_incidents:review'] as Permission[],
  suspected_incidents: ['suspected_incidents:read'] as Permission[],
  devices: ['devices:read'] as Permission[],
  health: ['devices:read'] as Permission[],
  settings: ['settings:read'] as Permission[],
} as const;

export function canAccess(permissions: readonly string[], required: readonly Permission[]) {
  return required.every((permission) => permissions.includes(permission));
}
