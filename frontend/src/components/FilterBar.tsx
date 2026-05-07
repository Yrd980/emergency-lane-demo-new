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
    <div className="mb-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
      <div className="mb-3 flex items-center gap-2 text-body-sm font-semibold text-on-surface">
        <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
        Narrow scope, reduce review thinking
      </div>
      <div className="grid gap-3 md:grid-cols-6">
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          Status
          <select
            className={inputClassName('mt-1')}
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="validated">Validated</option>
            <option value="false_alarm">False Alarm</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          Device
          <input
            className={inputClassName('mt-1')}
            value={filters.device_id || ''}
            onChange={(e) => update('device_id', e.target.value)}
            placeholder="device_id"
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          Sector
          <input
            className={inputClassName('mt-1')}
            value={filters.roi_id || ''}
            onChange={(e) => update('roi_id', e.target.value)}
            placeholder="roi_id"
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          Start From
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_from || '').slice(0, 16)}
            onChange={(e) => update('start_time_from', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <label className="flex flex-col text-label-xs font-medium text-on-surface-variant">
          Start To
          <input
            type="datetime-local"
            className={inputClassName('mt-1')}
            value={(filters.start_time_to || '').slice(0, 16)}
            onChange={(e) => update('start_time_to', e.target.value ? `${e.target.value}:00+08:00` : '')}
          />
        </label>
        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm font-semibold text-on-surface hover:bg-surface-container-high"
          onClick={() => onChange({ limit: '50', offset: '0' })}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Reset Filters
        </button>
      </div>
    </div>
  );
}
