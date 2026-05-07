import { cn } from '../utils/format';

export function inputClassName(className?: string) {
  return cn(
    'min-h-11 rounded-lg border border-outline-variant/50 bg-background px-3 py-2 text-body-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_8px_rgba(94,92,230,0.3)] disabled:bg-surface-container-low disabled:text-on-surface-variant/50',
    className,
  );
}

export function selectClassName(className?: string) {
  return cn(
    'min-h-11 appearance-none rounded-lg border border-outline-variant/50 bg-background px-3 py-2 pr-8 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary',
    className,
  );
}
