import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RefreshCw, XCircle } from 'lucide-react';
import { useRole } from '../access/useRole';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import { useEvents } from '../hooks/useEvents';
import { usePolling } from '../hooks/usePolling';
import type { OverviewStats } from '../types';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({ status: 'pending', limit: '50', offset: '0' });
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const firstEvent = data?.items[0];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'confirmed' | 'rejected' | null>(null);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const pendingIds = useMemo(() => data?.items.filter((item) => item.review_status === 'pending').map((item) => item.event_id) ?? [], [data]);

  const toggleSelect = (eventId: string) => {
    setBulkMessage(null);
    setSelectedIds((current) => current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]);
  };

  const toggleSelectAll = () => {
    setBulkMessage(null);
    const selected = new Set(selectedIds);
    const allSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !pendingIds.includes(id)) : Array.from(new Set([...selectedIds, ...pendingIds])));
  };

  const submitBulkReview = async (reviewStatus: 'confirmed' | 'rejected') => {
    if (selectedIds.length === 0) {
      setBulkMessage('先选择待复核事件，再执行批量审核。');
      return;
    }
    if (bulkStatus !== reviewStatus) {
      setBulkStatus(reviewStatus);
      setBulkMessage(`将批量${reviewStatus === 'confirmed' ? '确认' : '驳回'} ${selectedIds.length} 条事件，再次点击执行。`);
      return;
    }
    setSubmittingBulk(true);
    try {
      const result = await api.bulkReviewEvents(
        selectedIds,
        reviewStatus,
        reviewStatus === 'confirmed' ? '批量确认占用' : '批量驳回事件',
        role === 'reviewer' ? '本地复核员' : '本地复核管理',
      );
      setBulkMessage(`已处理 ${result.updated_count} 条事件。`);
      setSelectedIds([]);
      setBulkStatus(null);
      await refetch();
      await overview.refetch();
    } catch (e: unknown) {
      setBulkMessage((e as Error).message);
    } finally {
      setSubmittingBulk(false);
    }
  };

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
          description={firstEvent ? `队列已按优先级排序：${firstEvent.review_priority_reason ?? '按时间顺序处理'}，详情页的下一条只会指向剩余待复核事件。` : '可以等待新事件进入，或查看历史事件确认系统运行情况。'}
          tone={firstEvent ? 'warning' : 'success'}
          action={firstEvent ? <PrimaryButton href={`/events/${firstEvent.event_id}`}>开始复核</PrimaryButton> : <PrimaryButton href="/">返回工作台</PrimaryButton>}
        />
      </div>

      {overview.data && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">待复核</div>
            <div className="mt-1 text-2xl font-semibold text-amber-700">{overview.data.pending_review_count}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-slate-500">已确认</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">{overview.data.confirmed_count}</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
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
        <>
          <div className="mb-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-950">批量审核</div>
                <div className="mt-1 text-xs text-slate-500">已选择 {selectedIds.length} 条待复核事件，只处理当前队列中的未审核项。</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={submittingBulk}
                  onClick={toggleSelectAll}
                >
                  选择当前页
                </button>
                <PrimaryButton icon={CheckCircle2} disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('confirmed')}>
                  {bulkStatus === 'confirmed' ? '再次点击确认' : '批量确认'}
                </PrimaryButton>
                <PrimaryButton tone="danger" icon={XCircle} disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('rejected')}>
                  {bulkStatus === 'rejected' ? '再次点击驳回' : '批量驳回'}
                </PrimaryButton>
              </div>
            </div>
            {bulkMessage && <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{bulkMessage}</div>}
          </div>
          <EventTable
            items={data.items}
            total={data.total}
            offset={parseInt(filters.offset || '0')}
            limit={parseInt(filters.limit || '50')}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onPage={(newOffset) => {
              setSelectedIds([]);
              setFilters({ ...filters, offset: String(newOffset) });
              navigate('/review');
            }}
          />
        </>
      )}
    </div>
  );
}
