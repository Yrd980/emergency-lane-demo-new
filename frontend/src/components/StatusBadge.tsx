import { Circle } from 'lucide-react';
import { cn } from '../utils/format';

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: '待复核', cls: 'border-[var(--warning-soft)]/40 bg-[var(--warning-soft)]/15 text-[var(--warning)]' },
  confirmed: { label: '已确认', cls: 'border-[var(--brand-soft)]/40 bg-[var(--brand-soft)]/15 text-[var(--brand)]' },
  rejected: { label: '已驳回', cls: 'border-[var(--danger-soft)]/40 bg-[var(--danger-soft)]/15 text-[var(--danger)]' },
  online: { label: '在线', cls: 'border-[var(--brand-soft)]/40 bg-[var(--brand-soft)]/15 text-[var(--brand)]' },
  offline: { label: '离线', cls: 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]' },
  high: { label: '高优先级', cls: 'border-[var(--danger-soft)]/40 bg-[var(--danger-soft)]/15 text-[var(--danger)]' },
  normal: { label: '常规', cls: 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = statusConfig[status] ?? { label: label ?? status, cls: 'border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        cfg.cls,
      )}
    >
      <Circle className="h-2 w-2 fill-current" />
      {label ?? cfg.label}
    </span>
  );
}
