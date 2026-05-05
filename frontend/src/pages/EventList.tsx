import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';

export default function EventList() {
  const { data, loading, error, filters, setFilters } = useEvents();

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">事件列表</h1>
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <ErrorBanner message={`加载事件失败: ${error}`} />}
      {loading && !data && <div className="text-gray-400">加载中...</div>}
      {data && data.items.length === 0 && !error && !loading && (
        <EmptyState
          icon="🔍"
          title="暂无事件"
          description={filters.status ? `没有 ${filters.status} 状态的事件` : '还没有收到任何事件数据'}
        />
      )}
      {data && data.items.length > 0 && (
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
