export type Role = 'admin' | 'reviewer' | 'dispatcher' | 'patrol';
export type Permission =
  | 'events:read'
  | 'events:review'
  | 'events:assign'
  | 'events:delete'
  | 'tasks:read'
  | 'tasks:accept'
  | 'tasks:complete'
  | 'devices:read'
  | 'settings:read'
  | 'settings:write'
  | 'stats:read';

export const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  reviewer: 'Reviewer',
  dispatcher: 'Dispatcher',
  patrol: 'Patrol',
};

export const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', permissions: ['stats:read'] as Permission[] },
  { to: '/review', label: 'Review', icon: 'fact_check', permissions: ['events:review'] as Permission[] },
  { to: '/events', label: 'Incident Log', icon: 'emergency', permissions: ['events:read'] as Permission[] },
  { to: '/devices', label: 'Live Feed', icon: 'videocam', permissions: ['devices:read'] as Permission[] },
  { to: '/health', label: 'Health', icon: 'monitoring', permissions: ['devices:read'] as Permission[] },
  { to: '/settings', label: 'Settings', icon: 'settings', permissions: ['settings:read'] as Permission[] },
  { to: '/setup', label: 'Setup', icon: 'add_circle', permissions: ['devices:read'] as Permission[] },
] as const;

export const routeAccess = {
  dashboard: ['stats:read'] as Permission[],
  setup: ['devices:read'] as Permission[],
  review: ['events:review'] as Permission[],
  events: ['events:read'] as Permission[],
  devices: ['devices:read'] as Permission[],
  health: ['devices:read'] as Permission[],
  settings: ['settings:read'] as Permission[],
} as const;

export function canAccess(permissions: readonly string[], required: readonly Permission[]) {
  return required.every((permission) => permissions.includes(permission));
}
