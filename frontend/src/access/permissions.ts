import {
  Activity,
  ClipboardCheck,
  Gauge,
  MonitorSmartphone,
  Route,
  Settings,
  Siren,
} from 'lucide-react';

export type Role = 'reviewer' | 'operator' | 'maintainer';

export const roleLabels: Record<Role, string> = {
  reviewer: '复核员',
  operator: '运维员',
  maintainer: '管理员',
};

export const roleDescriptions: Record<Role, string> = {
  reviewer: '只处理待复核事件和证据判定。',
  operator: '负责设备接入、状态查看和事件观察。',
  maintainer: '负责系统健康和运行配置。',
};

export const navItems = [
  { to: '/', label: '工作台', icon: Gauge, roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/setup', label: '接入', icon: Route, roles: ['operator', 'maintainer'] as Role[] },
  { to: '/review', label: '复核', icon: ClipboardCheck, roles: ['reviewer', 'maintainer'] as Role[] },
  { to: '/events', label: '事件', icon: Siren, roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/devices', label: '设备', icon: MonitorSmartphone, roles: ['operator', 'maintainer'] as Role[] },
  { to: '/health', label: '健康', icon: Activity, roles: ['reviewer', 'operator', 'maintainer'] as Role[] },
  { to: '/settings', label: '设置', icon: Settings, roles: ['maintainer'] as Role[] },
] as const;

export const routeAccess = {
  dashboard: ['reviewer', 'operator', 'maintainer'] as Role[],
  setup: ['operator', 'maintainer'] as Role[],
  review: ['reviewer', 'maintainer'] as Role[],
  events: ['reviewer', 'operator', 'maintainer'] as Role[],
  devices: ['operator', 'maintainer'] as Role[],
  health: ['reviewer', 'operator', 'maintainer'] as Role[],
  settings: ['maintainer'] as Role[],
} as const;

export const defaultRole: Role = 'reviewer';

export function isRole(value: string | null | undefined): value is Role {
  return value === 'reviewer' || value === 'operator' || value === 'maintainer';
}

export function canAccess(role: Role, allowedRoles: readonly Role[]) {
  return allowedRoles.includes(role);
}

export function getRoleHome(role: Role) {
  if (role === 'reviewer') return '/review';
  if (role === 'operator') return '/setup';
  return '/health';
}
