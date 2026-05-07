import { cn } from '../utils/format';

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: '待复核', cls: 'bg-amber-100 text-amber-800 ring-amber-200' },
  confirmed: { label: '已确认', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-800 ring-red-200' },
  online: { label: '在线', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  offline: { label: '离线', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  high: { label: '高优先级', cls: 'bg-red-100 text-red-800 ring-red-200' },
  normal: { label: '常规', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = statusConfig[status] ?? { label: label ?? status, cls: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', cfg.cls)}>
      {label ?? cfg.label}
    </span>
  );
}
