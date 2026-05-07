import { Link } from 'react-router-dom';
import { cn } from '../utils/format';

type Tone = 'neutral' | 'brand' | 'warning' | 'danger' | 'success';

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
    <div className="mb-lg flex flex-col gap-md border-b border-outline-variant/10 pb-lg lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="mb-1 inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-label-xs font-label-xs text-primary uppercase tracking-wider">
            {eyebrow}
          </div>
        )}
        <h1 className="text-headline-md font-headline-md text-on-surface">{title}</h1>
        {description && <p className="mt-sm max-w-2xl text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-sm">{action}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  icon,
  onClick,
  href,
  tone = 'dark',
  disabled,
}: {
  children: React.ReactNode;
  icon?: string;
  onClick?: () => void;
  href?: string;
  tone?: 'dark' | 'light' | 'danger';
  disabled?: boolean;
}) {
  const cls = cn(
    'inline-flex min-h-10 items-center justify-center gap-sm rounded-lg px-md py-sm text-label-xs font-label-xs font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50',
    tone === 'dark' && 'bg-primary text-on-primary hover:brightness-110',
    tone === 'light' && 'border border-outline-variant/30 bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
    tone === 'danger' && 'bg-error-container text-on-error-container hover:brightness-110',
  );

  const content = (
    <>
      {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    const isInternal = href.startsWith('/');
    return isInternal ? <Link className={cls} to={href}>{content}</Link> : <a className={cls} href={href}>{content}</a>;
  }
  return <button className={cls} onClick={onClick} disabled={disabled}>{content}</button>;
}

export function MetricTile({
  label,
  value,
  helper,
  tone = 'neutral',
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: Tone;
  icon?: string;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant/5 hover:border-primary/20 transition-all group">
      <div className="flex justify-between items-start mb-md">
        {icon && <span className={`p-sm rounded-lg material-symbols-outlined ${tone === 'brand' || tone === 'success' ? 'bg-primary-container/10 text-primary' : tone === 'warning' ? 'bg-secondary-container/10 text-secondary' : tone === 'danger' ? 'bg-error-container/10 text-error' : 'bg-surface-container-high text-on-surface-variant'}`}>{icon}</span>}
        {trend && (
          <span className={cn(
            'text-label-xs font-label-xs px-sm py-xs rounded-full',
            trend.positive ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10',
          )}>{trend.value}</span>
        )}
      </div>
      <h3 className="text-on-surface-variant font-label-xs text-label-xs uppercase tracking-wider mb-xs">{label}</h3>
      <p className={cn(
        'font-mono-data text-display-lg',
        tone === 'brand' || tone === 'success' ? 'text-primary' :
        tone === 'warning' ? 'text-secondary' :
        tone === 'danger' ? 'text-error' : 'text-on-surface',
      )}>{value}</p>
      {helper && <p className="text-label-xs text-on-surface-variant mt-sm">{helper}</p>}
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
    <div className={cn(
      'rounded-xl border p-lg',
      tone === 'default' && 'border-outline-variant/10 bg-surface-container-low',
      tone === 'warning' && 'border-secondary-container/40 bg-secondary-container/10',
      tone === 'danger' && 'border-error-container/40 bg-error-container/10',
      tone === 'success' && 'border-primary-container/40 bg-primary-container/10',
    )}>
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-on-surface">{title}</div>
          <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">{description}</div>
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
  const loadingIndicator = (
    <span
      className="h-10 w-10 animate-spin rounded-full border-2 border-outline-variant/30 border-t-primary"
      aria-hidden="true"
    />
  );

  return (
    <div className="flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low p-xl text-center">
      {tone === 'loading' ? loadingIndicator : (
        <span className={cn(
          'material-symbols-outlined text-4xl',
          tone === 'error' && 'text-error',
          tone === 'success' && 'text-primary',
          tone === 'empty' && 'text-on-surface-variant',
        )}>
          {tone === 'error' ? 'error' : tone === 'success' ? 'check_circle' : 'inventory_2'}
        </span>
      )}
      <div className="mt-lg text-headline-md font-headline-md text-on-surface">{title}</div>
      <p className="mt-sm w-full max-w-[34rem] text-body-sm leading-6 text-on-surface-variant">{description}</p>
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl border border-outline-variant/5 bg-surface-container-low" />
      ))}
    </div>
  );
}

export function SurfacePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-outline-variant/5 bg-surface-container-low', className)}>
      {children}
    </div>
  );
}
