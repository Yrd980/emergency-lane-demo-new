import { useSearchParams } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import { PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';

export default function EventList() {
  const [searchParams] = useSearchParams();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({
    sort: 'created_desc',
    ...(searchParams.get('roi_id') ? { roi_id: searchParams.get('roi_id') || '' } : {}),
    ...(searchParams.get('status') ? { status: searchParams.get('status') || '' } : {}),
  });

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="疑似事件"
        title="疑似事件日志"
        description="使用历史筛选进行证据追溯；日常待处理请前往审核工作台。"
        action={
          <>
            <span className="inline-flex min-h-11 items-center gap-xs rounded-lg border border-primary/15 bg-primary/10 px-md text-body-sm font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              实时流
            </span>
            <PrimaryButton href="/review">前往审核工作台</PrimaryButton>
          </>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} />
      {error && <StateBlock tone="error" title="疑似事件加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重试</PrimaryButton>} />}
      {loading && !data && <StateBlock tone="loading" title="正在加载疑似事件" description="正在同步疑似事件列表与证据缩略图。" />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          title="未找到匹配疑似事件"
          description={filters.status ? '建议：清空筛选，或返回配置向导生成测试疑似事件。' : '建议：先完成设备接入，再从 Android 端生成测试疑似事件。'}
          action={<PrimaryButton href={filters.status ? '/events' : '/setup'}>{filters.status ? '清空筛选' : '打开配置向导'}</PrimaryButton>}
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
