import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';

export default function EventList() {
  const { data, loading, error, filters, setFilters } = useEvents();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">事件列表</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <div className="text-red-500 text-sm mb-2">加载失败: {error}</div>}
      {loading && !data && <div className="text-gray-400">加载中...</div>}
      {data && (
        <EventTable
          items={data.items}
          total={data.total}
          offset={parseInt(filters.offset || '0')}
          limit={parseInt(filters.limit || '50')}
          onPage={(newOffset) => setFilters({ ...filters, offset: String(newOffset) })}
        />
      )}
    </div>
  );
}
