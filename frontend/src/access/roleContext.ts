import { createContext } from 'react';
import type { Permission, Role } from './permissions';

export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
  role: Role;
  permissions: Permission[];
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
