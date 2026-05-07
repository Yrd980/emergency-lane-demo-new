import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../utils/format';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)]/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  icon: Icon = ArrowRight,
  onClick,
  href,
  tone = 'dark',
  disabled,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  tone?: 'dark' | 'light' | 'danger';
  disabled?: boolean;
}) {
  const cls = cn(
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all active:scale-95',
    tone === 'dark' && 'bg-[var(--brand)] text-[var(--on-brand)] shadow-[0_4px_16px_rgba(94,92,230,0.25)] hover:bg-[var(--brand-strong)] hover:text-[var(--on-brand)]',
    tone === 'light' && 'border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-glow)]',
    tone === 'danger' && 'bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[#b0000a]',
    disabled && 'pointer-events-none opacity-50',
  );
  if (href) {
    return (
      <a className={cls} href={href}>
        {children}
        <Icon className="h-4 w-4" />
      </a>
    );
  }
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function MetricTile({
  label,
  value,
  helper,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'neutral' | 'warning' | 'success' | 'danger';
}) {
  return (
    <div className="rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)] p-4 hover:border-[var(--brand)]/20 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">{label}</span>
        {tone === 'warning' && <span className="material-symbols-outlined text-[var(--warning-soft)] text-base">warning</span>}
        {tone === 'success' && <span className="material-symbols-outlined text-[var(--brand-soft)] text-base">check_circle</span>}
        {tone === 'danger' && <span className="material-symbols-outlined text-[var(--danger)] text-base">error</span>}
      </div>
      <div
        className={cn(
          'mt-1 font-mono text-2xl font-semibold tracking-tight sm:text-3xl',
          tone === 'warning' && 'text-[var(--warning)]',
          tone === 'success' && 'text-[var(--brand)]',
          tone === 'danger' && 'text-[var(--danger)]',
          tone === 'neutral' && 'text-[var(--text)]',
        )}
      >
        {value}
      </div>
      {helper && <div className="mt-2 text-[11px] text-[var(--muted)]">{helper}</div>}
    </div>
  );
}

export function ActionPanel({
  title,
  description,
  action,
  tone = 'default',
}: {
  title: string;
  description: string;
  action: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        tone === 'default' && 'border-[var(--line)]/10 bg-[var(--surface-soft)]',
        tone === 'warning' && 'border-[var(--warning-soft)]/40 bg-[var(--warning-soft)]/10',
        tone === 'danger' && 'border-[var(--danger-soft)]/40 bg-[var(--danger-soft)]/10',
        tone === 'success' && 'border-[var(--brand-soft)]/40 bg-[var(--brand-soft)]/10',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-[var(--text)]">{title}</div>
          <div className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

export function StateBlock({
  title,
  description,
  action,
  tone = 'empty',
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'empty' | 'loading' | 'error' | 'success';
}) {
  const Icon = tone === 'loading' ? Loader2 : tone === 'error' ? AlertTriangle : CheckCircle2;
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-8 text-center">
      <Icon
        className={cn(
          'h-10 w-10',
          tone === 'loading' && 'animate-spin text-[var(--brand)]',
          tone === 'error' && 'text-[var(--danger)]',
          tone === 'success' && 'text-[var(--brand)]',
          tone === 'empty' && 'text-[var(--muted)]',
        )}
      />
      <div className="mt-4 text-base font-semibold text-[var(--text)]">{title}</div>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)]" />
      ))}
    </div>
  );
}

export function SurfacePanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)]', className)}>
      {children}
    </div>
  );
}
