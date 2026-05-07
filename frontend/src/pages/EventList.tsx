import { RefreshCw } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import { PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';

export default function EventList() {
  const { data, loading, error, filters, setFilters, refetch } = useEvents();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="EVENTS"
        title="事件查询"
        description="这里用于历史查询和问题追溯；日常处理优先从复核工作台进入。"
        action={<PrimaryButton href="/review">进入复核工作台</PrimaryButton>}
      />
      <FilterBar filters={filters} onChange={setFilters} />
      {error && <StateBlock tone="error" title="事件加载失败" description={error} action={<PrimaryButton icon={RefreshCw} onClick={refetch}>重试</PrimaryButton>} />}
      {loading && !data && <StateBlock tone="loading" title="正在加载事件" description="系统正在同步事件列表和证据缩略图。" />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          title="没有符合条件的事件"
          description={filters.status ? '下一步：清除筛选，或回到接入向导生成测试事件。' : '下一步：先完成设备接入，再从 Android 端生成测试事件。'}
          action={<PrimaryButton href={filters.status ? '/events' : '/setup'}>{filters.status ? '清除筛选' : '打开接入向导'}</PrimaryButton>}
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
