import { RotateCcw, Search } from 'lucide-react';
import { inputClassName } from './styles';

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
}) {
  const update = (key: string, value: string) => {
    const next = { ...filters, [key]: value, offset: '0' };
    if (!value) delete next[key];
    onChange(next);
  };

  return (
    <div className="mb-4 rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        缩小范围，减少复核思考
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
          状态
          <select
            className={inputClassName('mt-1')}
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">全部</option>
            <option value="pending">待复核</option>
            <option value="confirmed">已确认</option>
            <option value="rejected">已驳回</option>
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
          设备
          <input
            className={inputClassName('mt-1')}
            value={filters.device_id || ''}
            onChange={(e) => update('device_id', e.target.value)}
            placeholder="device_id"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
          开始时间起
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_from || '').slice(0, 16)}
            onChange={(e) => update('start_time_from', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-[var(--muted)]">
          开始时间止
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_to || '').slice(0, 16)}
            onChange={(e) => update('start_time_to', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-raised)]"
          onClick={() => onChange({ limit: '50', offset: '0' })}
        >
          <RotateCcw className="h-4 w-4" />
          重置筛选
        </button>
      </div>
    </div>
  );
}
