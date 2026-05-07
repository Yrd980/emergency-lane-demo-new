import { Circle } from 'lucide-react';
import { cn } from '../utils/format';

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: '待复核', cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  confirmed: { label: '已确认', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  rejected: { label: '已驳回', cls: 'border-rose-200 bg-rose-50 text-rose-800' },
  online: { label: '在线', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  offline: { label: '离线', cls: 'border-slate-200 bg-slate-100 text-slate-700' },
  high: { label: '高优先级', cls: 'border-rose-200 bg-rose-50 text-rose-800' },
  normal: { label: '常规', cls: 'border-slate-200 bg-slate-100 text-slate-700' },
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = statusConfig[status] ?? { label: label ?? status, cls: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        cfg.cls,
      )}
    >
      <Circle className="h-2 w-2 fill-current" />
      {label ?? cfg.label}
    </span>
  );
}
