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
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
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
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
    tone === 'dark' && 'bg-slate-950 text-white hover:bg-slate-800',
    tone === 'light' && 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
    tone === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className={cn(
          'mt-2 text-3xl font-semibold tracking-tight',
          tone === 'warning' && 'text-amber-700',
          tone === 'success' && 'text-emerald-700',
          tone === 'danger' && 'text-red-700',
          tone === 'neutral' && 'text-slate-950',
        )}
      >
        {value}
      </div>
      {helper && <div className="mt-2 text-xs text-slate-500">{helper}</div>}
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
        'rounded-lg border p-4 shadow-sm',
        tone === 'default' && 'border-slate-200 bg-white',
        tone === 'warning' && 'border-amber-200 bg-amber-50',
        tone === 'danger' && 'border-red-200 bg-red-50',
        tone === 'success' && 'border-emerald-200 bg-emerald-50',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-slate-950">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
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
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Icon className={cn('h-8 w-8', tone === 'loading' && 'animate-spin', tone === 'error' ? 'text-red-600' : 'text-amber-500')} />
      <div className="mt-4 text-lg font-semibold text-slate-950">{title}</div>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
      ))}
    </div>
  );
}
