import { createContext } from 'react';

export type ToastTone = 'success' | 'info' | 'error';

export const ToastContext = createContext<{
  showToast: (message: string, tone?: ToastTone) => void;
} | null>(null);
