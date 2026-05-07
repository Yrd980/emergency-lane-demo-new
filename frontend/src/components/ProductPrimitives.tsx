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
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
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
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:ring-offset-2',
    tone === 'dark' && 'bg-slate-950 text-white hover:bg-slate-800',
    tone === 'light' && 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50',
    tone === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
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
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight sm:text-[2rem]',
          tone === 'warning' && 'text-amber-700',
          tone === 'success' && 'text-emerald-700',
          tone === 'danger' && 'text-rose-700',
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
        'rounded-md border p-4 shadow-sm',
        tone === 'default' && 'border-slate-200 bg-white',
        tone === 'warning' && 'border-amber-200 bg-amber-50/80',
        tone === 'danger' && 'border-rose-200 bg-rose-50/80',
        tone === 'success' && 'border-emerald-200 bg-emerald-50/80',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-slate-950">{title}</div>
          <div className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</div>
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
    <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
      <Icon className={cn('h-8 w-8', tone === 'loading' && 'animate-spin', tone === 'error' ? 'text-rose-600' : 'text-amber-500')} />
      <div className="mt-4 text-base font-semibold text-slate-950">{title}</div>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-md border border-slate-200 bg-white shadow-sm" />
      ))}
    </div>
  );
}
