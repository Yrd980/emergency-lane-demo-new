import { cn } from '../utils/format';

export function inputClassName(className?: string) {
  return cn(
    'rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--brand-soft)] focus:ring-1 focus:ring-[var(--brand-soft)] focus:shadow-[0_0_8px_rgba(94,92,230,0.3)] disabled:bg-[var(--surface-soft)] disabled:text-[var(--faint)]',
    className,
  );
}

export function selectClassName(className?: string) {
  return cn(
    'appearance-none rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 pr-8 text-sm text-[var(--text)] outline-none transition focus:border-[var(--brand-soft)] focus:ring-1 focus:ring-[var(--brand-soft)]',
    className,
  );
}
