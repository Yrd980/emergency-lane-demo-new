import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAuth } from '../access/useRole';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { useEvents } from '../hooks/useEvents';
import { usePolling } from '../hooks/usePolling';
import type { OverviewStats } from '../types';

export default function ReviewQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, filters, setFilters, refetch } = useEvents({ status: 'pending', sort: 'review_priority', limit: '50', offset: '0' });
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const firstEvent = data?.items[0];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'validated' | 'false_alarm' | null>(null);
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

  const submitBulkReview = async (reviewStatus: 'validated' | 'false_alarm') => {
    if (selectedIds.length === 0) {
      setBulkMessage('请先选择待审核事件，再选择审核结果。');
      return;
    }
    if (bulkStatus !== reviewStatus) {
      setBulkStatus(reviewStatus);
      setBulkMessage(
        reviewStatus === 'validated'
          ? `确认将 ${selectedIds.length} 条事件标记为已确认。批量确认要求证据包含前段、峰值、后段。再次点击以执行。`
          : `将 ${selectedIds.length} 条事件标记为误报。再次点击以执行。`,
      );
      return;
    }
    setSubmittingBulk(true);
    try {
      const result = await api.bulkReviewEvents(
        selectedIds,
        reviewStatus,
        reviewStatus === 'validated' ? '批量确认' : '批量标记误报',
        user?.display_name ?? 'Aegis 审核员',
      );
      const failedCount = result.failed_event_ids?.length ?? 0;
      const missingCount = result.missing_event_ids.length;
      setBulkMessage(
        failedCount || missingCount
          ? `已处理 ${result.updated_count} 条事件。${failedCount} 条因证据或状态策略被阻止，${missingCount} 条不存在。`
          : `已处理 ${result.updated_count} 条事件。`,
      );
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
    <div className="space-y-lg">
      <PageHeader
        eyebrow="审核"
        title="审核工作台"
        description="将待审核队列作为工单处理：优先处理高优先级，再依次推进。"
        action={
          firstEvent ? (
            <PrimaryButton icon="fact_check" href={`/events/${firstEvent.event_id}?from=review`}>处理下一个</PrimaryButton>
          ) : (
            <PrimaryButton href="/events">查看历史</PrimaryButton>
          )
        }
      />

      <div>
        <ActionPanel
          title={firstEvent ? '下一步：打开队列首个事件' : '当前无待审核事件'}
          description={firstEvent ? `队列按优先级排序：${firstEvent.review_priority_reason ?? '按时间顺序'}，详情页仅推进待审核事件。` : '请等待新事件，或查看历史记录。'}
          tone={firstEvent ? 'warning' : 'success'}
          action={firstEvent ? <PrimaryButton href={`/events/${firstEvent.event_id}?from=review`}>开始审核</PrimaryButton> : <PrimaryButton href="/">返回工作台</PrimaryButton>}
        />
      </div>

      {overview.data && (
        <div className="mb-lg grid gap-4 sm:grid-cols-3">
          <MetricTile label="待审核" value={overview.data.pending_review_count} tone="warning" />
          <MetricTile label="已确认" value={overview.data.confirmed_count} tone="success" />
          <MetricTile label="误报" value={overview.data.rejected_count} tone="danger" />
        </div>
      )}

      {error && (
        <StateBlock tone="error" title="审核队列加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重试</PrimaryButton>} />
      )}
      {loading && !data && <StateBlock tone="loading" title="正在加载审核队列" description="正在获取待审核事件。" />}
      {data && data.items.length === 0 && !error && !loading && (
        <StateBlock
          tone="success"
          title="审核队列已清空"
          description="可返回工作台查看设备健康状态，或等待 Android 端新事件。"
          action={<PrimaryButton href="/">返回工作台</PrimaryButton>}
        />
      )}
      {data && data.items.length > 0 && (
        <>
          {/* Bulk Actions Bar */}
          <SurfacePanel className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-body-sm font-semibold text-on-surface">已选择审核操作</div>
                <div className="mt-1 text-label-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-sm py-xs text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {selectedIds.length} 个已选
                  </span>
                  {' '}来自当前队列的待审核项。
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-sm rounded-lg border border-outline-variant/50 bg-surface-container-high px-3 py-2 text-body-sm font-semibold text-on-surface transition-all hover:bg-surface-container-highest disabled:opacity-50"
                  disabled={submittingBulk}
                  onClick={toggleSelectAll}
                >
                  全选本页
                </button>
                <PrimaryButton tone="light" icon="check_circle" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('validated')}>
                  {bulkStatus === 'validated' ? '确认执行' : '确认所选'}
                </PrimaryButton>
                <PrimaryButton tone="danger" icon="cancel" disabled={submittingBulk || selectedIds.length === 0} onClick={() => submitBulkReview('false_alarm')}>
                  {bulkStatus === 'false_alarm' ? '执行误报标记' : '标记为误报'}
                </PrimaryButton>
              </div>
            </div>
            {bulkMessage && (
              <div className="mt-3 rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant border border-outline-variant/10">
                {bulkMessage}
              </div>
            )}
          </SurfacePanel>

          <EventTable
            mode="review"
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
