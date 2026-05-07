import { defaultRole, isRole, type Role } from './permissions';

const STORAGE_KEY = 'laneops-role';

export function readStoredRole(): Role {
  if (typeof window === 'undefined') return defaultRole;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isRole(stored) ? stored : defaultRole;
}

export function writeStoredRole(role: Role) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, role);
}
