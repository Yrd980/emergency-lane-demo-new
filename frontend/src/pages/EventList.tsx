import { useEvents } from '../hooks/useEvents';
import FilterBar from '../components/FilterBar';
import EventTable from '../components/EventTable';
import { PrimaryButton, StateBlock } from '../components/ProductPrimitives';

export default function EventList() {
  const { data, loading, error, filters, setFilters, refetch } = useEvents();

  return (
    <div className="space-y-5">
      <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)]/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider">
            EVENTS
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight sm:text-3xl">事件查询</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--success)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
              LIVE FEED
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">这里用于历史查询和问题追溯；日常处理优先从复核工作台进入。</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <PrimaryButton href="/review">进入复核工作台</PrimaryButton>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />
      {error && <StateBlock tone="error" title="事件加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重试</PrimaryButton>} />}
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
