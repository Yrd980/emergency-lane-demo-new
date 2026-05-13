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
    <div className="mb-4 rounded-lg border border-outline-variant/10 bg-surface-container-low p-4">
      <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-on-surface">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
        缩小筛选范围
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          状态
          <select
            className={inputClassName('mt-1')}
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="validated">已确认</option>
            <option value="false_alarm">误报</option>
            <option value="assigned">已派发</option>
            <option value="accepted">已接单</option>
            <option value="completed">已完成</option>
            <option value="closed">已关闭</option>
          </select>
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          设备
          <input
            className={inputClassName('mt-1')}
            value={filters.device_id || ''}
            onChange={(e) => update('device_id', e.target.value)}
            placeholder="device_id"
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
         路段
          <input
            className={inputClassName('mt-1')}
            value={filters.roi_id || ''}
            onChange={(e) => update('roi_id', e.target.value)}
            placeholder="roi_id"
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          开始时间（起）
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_from || '').slice(0, 16)}
            onChange={(e) => update('start_time_from', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          开始时间（止）
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_to || '').slice(0, 16)}
            onChange={(e) => update('start_time_to', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-body-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          onClick={() => onChange({ limit: '50', offset: '0' })}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          重置筛选
        </button>
      </div>
    </div>
  );
}
