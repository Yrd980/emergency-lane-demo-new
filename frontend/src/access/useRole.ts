import { useContext } from 'react';
import { AuthContext } from './roleContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export const useRole = useAuth;
