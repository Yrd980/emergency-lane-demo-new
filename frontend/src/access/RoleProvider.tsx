import { useEffect, useMemo, useState } from 'react';
import { RoleContext } from './roleContext';
import { readStoredRole, writeStoredRole } from './roleStore';
import type { Role } from './permissions';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => readStoredRole());

  useEffect(() => {
    writeStoredRole(role);
  }, [role]);

  const value = useMemo(
    () => ({
      role,
      setRole: setRoleState,
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
