import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import { useEvents } from '../hooks/useEvents';
import { usePolling } from '../hooks/usePolling';
import type { OverviewStats } from '../types';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({ status: 'pending', limit: '50', offset: '0' });
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const firstEvent = data?.items[0];

  return (
    <div>
      <PageHeader
        eyebrow="REVIEW"
        title="复核工作台"
        description="把待复核事件当成工作队列处理。先处理高优先级，再进入下一条，减少反复筛选。"
        action={
          firstEvent ? (
            <PrimaryButton icon={ClipboardCheck} href={`/events/${firstEvent.event_id}`}>处理下一条</PrimaryButton>
          ) : (
            <PrimaryButton href="/events">查看历史事件</PrimaryButton>
          )
        }
      />

      <div className="mb-5">
        <ActionPanel
          title={firstEvent ? '下一步：打开队首事件' : '当前没有待复核事件'}
          description={firstEvent ? `${firstEvent.review_priority_reason ?? '按时间顺序处理'}，完成后系统会引导到下一条。` : '可以等待新事件进入，或查看历史事件确认系统运行情况。'}
          tone={firstEvent ? 'warning' : 'success'}
          action={firstEvent ? <PrimaryButton href={`/events/${firstEvent.event_id}`}>开始复核</PrimaryButton> : <PrimaryButton href="/">返回工作台</PrimaryButton>}
        />
      </div>

      {overview.data && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">待复核</div>
            <div className="mt-1 text-2xl font-semibold text-amber-700">{overview.data.pending_review_count}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">已确认</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">{overview.data.confirmed_count}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">已驳回</div>
            <div className="mt-1 text-2xl font-semibold text-red-700">{overview.data.rejected_count}</div>
          </div>
        </div>
      )}

      {error && (
        <StateBlock tone="error" title="复核队列加载失败" description={error} action={<PrimaryButton icon={RefreshCw} onClick={refetch}>重试</PrimaryButton>} />
      )}
      {loading && !data && <StateBlock tone="loading" title="正在加载复核队列" description="按待复核状态拉取事件。" />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          tone="success"
          title="待复核队列已清空"
          description="下一步：返回工作台查看设备健康，或等待 Android 端上传新事件。"
          action={<PrimaryButton href="/">返回工作台</PrimaryButton>}
        />
      )}
      {data && data.items.length > 0 && (
        <EventTable
          items={data.items}
          total={data.total}
          offset={parseInt(filters.offset || '0')}
          limit={parseInt(filters.limit || '50')}
          onPage={(newOffset) => {
            setFilters({ ...filters, offset: String(newOffset) });
            navigate('/review');
          }}
        />
      )}
    </div>
  );
}
