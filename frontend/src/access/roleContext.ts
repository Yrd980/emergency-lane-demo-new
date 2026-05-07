import { createContext } from 'react';
import type { Role } from './permissions';

export type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

export const RoleContext = createContext<RoleContextValue | null>(null);
