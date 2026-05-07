import { useContext } from 'react';
import { RoleContext } from './roleContext';

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
