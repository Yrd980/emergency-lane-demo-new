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
    <div className="flex gap-3 mb-4 flex-wrap items-end">
      <label className="flex flex-col text-xs text-gray-500">
        状态
        <select
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value)}
        >
          <option value="">全部</option>
          <option value="pending">待复核</option>
          <option value="confirmed">已确认</option>
          <option value="rejected">已驳回</option>
        </select>
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        设备
        <input
          className="border rounded px-2 py-1 text-sm mt-0.5 w-32"
          value={filters.device_id || ''}
          onChange={(e) => update('device_id', e.target.value)}
          placeholder="设备 ID"
        />
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        开始时间起
        <input
          type="datetime-local"
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={(filters.start_time_from || '').slice(0, 16)}
          onChange={(e) => update('start_time_from', e.target.value ? e.target.value + ':00+08:00' : '')}
        />
      </label>
      <label className="flex flex-col text-xs text-gray-500">
        开始时间止
        <input
          type="datetime-local"
          className="border rounded px-2 py-1 text-sm mt-0.5"
          value={(filters.start_time_to || '').slice(0, 16)}
          onChange={(e) => update('start_time_to', e.target.value ? e.target.value + ':00+08:00' : '')}
        />
      </label>
      <button
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => onChange({ limit: '50', offset: '0' })}
      >
        重置
      </button>
    </div>
  );
}
