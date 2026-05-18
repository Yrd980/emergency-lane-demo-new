import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { inputClassName, selectClassName } from '../components/styles';
import { useToast } from '../hooks/useToast';
import type { EventDetail as EventDetailType, ReviewHistoryItem } from '../types';
import { cn, formatFullDateTime, formatPercent } from '../utils/format';
import { useAuth } from '../access/useRole';

function formatGpsLocation(gps: unknown): string {
  if (!gps || typeof gps !== 'object') return '--';
  const location = gps as { lat?: unknown; lng?: unknown };
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return '--';
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

/* ─── Timeline builder ─── */
interface TimelineEntry {
  id: string;
  label: string;
  time: string;
  tone: 'brand' | 'warning' | 'danger' | 'muted';
}

function buildTimeline(data: EventDetailType): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: 'detection',
      label: '系统检测：应急车道占用',
      time: formatFullDateTime(data.start_time),
      tone: 'brand',
    },
    {
      id: 'alert',
      label: '自动告警已生成',
      time: formatFullDateTime(data.created_at),
      tone: 'warning',
    },
  ];

  if (data.review_status === 'validated') {
    entries.push({
      id: 'validated',
      label: '复核已确认',
      time: formatFullDateTime(data.reviewed_at),
      tone: 'brand',
    });
  } else if (data.review_status === 'false_alarm') {
    entries.push({
      id: 'false_alarm',
      label: '已标记误报',
      time: formatFullDateTime(data.reviewed_at),
      tone: 'danger',
    });
  } else {
    entries.push({
      id: 'pending',
      label: '等待人工处置',
      time: '--',
      tone: 'muted',
    });
  }

  return entries;
}

/* ─── Main component ─── */
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);
  const [assignees, setAssignees] = useState<{ username: string; display_name: string; role: string }[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('从事件详情派发');
  const [assigning, setAssigning] = useState(false);

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);
  const canAssign = Boolean(user?.permissions.includes('events:assign'));
  const canReview = Boolean(user?.permissions.includes('events:review'));

  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    api.getAssignableUsers()
      .then((users) => {
        if (cancelled) return;
        setAssignees(users);
        setSelectedAssignee((current) => current || users.find((item) => item.role === 'patrol')?.username || users[0]?.username || '');
      })
      .catch((e: unknown) => showToast((e as Error).message, 'error'));
    return () => { cancelled = true; };
  }, [canAssign, showToast]);

  if (loading && !data) return <StateBlock tone="loading" title="正在加载事件详情" description="同步证据、结构化字段和复核状态。" />;
  if (error) {
    return (
      <StateBlock
        tone="error"
        title={error.includes('不存在') ? '事件不存在' : '事件详情加载失败'}
        description={error}
        action={
          <PrimaryButton
            icon={error.includes('不存在') ? 'arrow_back' : 'refresh'}
            onClick={() => (error.includes('不存在') ? navigate('/events') : refetch())}
          >
            {error.includes('不存在') ? '返回事件列表' : '重试'}
          </PrimaryButton>
        }
      />
    );
  }
  if (!data) return null;

  const source = searchParams.get('from') === 'log' ? 'log' : 'review';
  const backHref = source === 'log' ? '/events' : '/review';
  const backLabel = source === 'log' ? '返回日志' : '返回队列';
  const nextEventId = source === 'log' ? data.previous_event_id : data.next_event_id;
  const nextHref = nextEventId ? `/events/${nextEventId}?from=${source}` : null;
  const nextLabel = source === 'log' ? '下一条日志' : '下一条待复核';

  const handleReview = async (status: string, note: string, operatorId?: string): Promise<boolean> => {
    const ok = await submit(status, note, operatorId);
    if (ok) {
      showToast(status === 'validated' ? '已确认占用，复核结果已保存' : '已标记为误报，复核结果已保存', 'success');
      refetch();
    }
    return ok;
  };

  const gpsText = formatGpsLocation(data.gps_location);
  const images = data.evidence_files.filter((f) => f.mime_type.startsWith('image/'));
  const hasImages = images.length > 0;

  const assignToPatrol = async () => {
    if (!selectedAssignee) {
      showToast('请选择巡查员后再分派', 'error');
      return;
    }
    setAssigning(true);
    try {
      await api.assignEvent(data.event_id, { assigned_to_username: selectedAssignee, note: assignmentNote });
      showToast('任务已派发给巡查员', 'success');
      refetch();
    } catch (e: unknown) {
      showToast((e as Error).message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Page header ─── */}
      <PageHeader
        eyebrow="事件复核"
        title="事件详情"
        description={source === 'log' ? '按事件时间线查看证据、状态和处理记录。' : '先看证据链，再核对结构化字段，最后完成复核。'}
        action={
          <>
            <PrimaryButton tone="light" icon="arrow_back" onClick={() => navigate(backHref)}>
              {backLabel}
            </PrimaryButton>
            <PrimaryButton tone="light" icon="refresh" onClick={refetch}>
              刷新当前
            </PrimaryButton>
            {nextHref && (
              <PrimaryButton icon="arrow_forward" href={nextHref}>
                {nextLabel}
              </PrimaryButton>
            )}
          </>
        }
      />

      {/* ─── Incident badge bar ─── */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant/10 bg-surface-container-low p-md">
        <FieldChip label="事件 ID" value={data.event_id} mono />
        <div className="h-4 w-px bg-outline-variant/30" />
        <FieldChip label="设备" value={data.device_id} mono />
        <div className="h-4 w-px bg-outline-variant/30" />
        <FieldChip label="优先级" value={<StatusBadge status={data.risk_level ?? 'normal'} />} />
        <div className="ml-auto">
          <FieldChip label="状态" value={<StatusBadge status={data.review_status} />} />
        </div>
      </div>

      {/* ─── Action banner ─── */}
      <ActionPanel
        tone={data.review_status === 'pending' ? 'warning' : 'success'}
        title={data.review_status === 'pending' ? '下一步：完成此事件复核' : '此事件已复核'}
        description={
          data.review_status === 'pending'
            ? data.review_priority_reason ?? '请根据证据链作出确认或驳回。'
            : source === 'log' ? '可以继续按时间线查看下一条，或返回事件日志。' : '可以继续查看下一条待复核事件，或返回复核队列。'
        }
        action={
          data.review_status === 'pending' ? (
            <StatusBadge status={data.risk_level ?? 'normal'} />
          ) : (
            <PrimaryButton href={backHref}>{source === 'log' ? '回到事件日志' : '回到复核队列'}</PrimaryButton>
          )
        }
      />

      {/* ─── Main split layout ─── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ════════════ LEFT: EVIDENCE ════════════ */}
        <section className="space-y-5">
          {/* Video player / evidence viewer */}
          <div className="overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low">
            {/* Camera label bar */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-on-surface-variant">videocam</span>
                <span className="text-xs font-medium text-on-surface">{data.device_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-error-container/30 px-2.5 py-0.5 text-[11px] font-semibold text-error">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error shadow-[0_0_6px_#ffb4ab]" />
                  实时
                </span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono-data text-[11px] text-primary">
                  {data.roi_id}
                </span>
              </div>
            </div>

            {/* Media player */}
            <EvidenceViewer files={data.evidence_files} summary={data.evidence_summary} />
          </div>

          {/* Evidence snapshot thumbnails grid */}
          {hasImages && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">photo_library</span>
                <span className="text-label-xs font-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  证据快照
                </span>
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono-data text-[10px] text-on-surface-variant">
                  {images.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {images.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container cursor-zoom-in hover:border-primary transition-colors"
                  >
                    <img
                      src={file.url}
                      alt={file.evidence_type}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/0 transition duration-200 group-hover:bg-surface-container-lowest/50">
                      <span className="material-symbols-outlined text-2xl text-on-surface opacity-0 transition duration-200 group-hover:opacity-100">
                        zoom_in
                      </span>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-surface-container-lowest/70 px-1.5 py-0.5 font-mono-data text-[10px] text-on-surface-variant">
                      {file.evidence_type === 'frame_peak'
                        ? '峰值'
                        : file.evidence_type === 'frame_before'
                          ? '进入前'
                          : file.evidence_type === 'frame_after'
                            ? '离开后'
                            : file.evidence_type}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ════════════ RIGHT SIDEBAR ════════════ */}
        <aside className="space-y-5">
          {/* ─── AI Recognition panel ─── */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-outline-variant/10 bg-surface-container px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">precision_manufacturing</span>
                <span className="text-sm font-semibold text-on-surface">AI 识别</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <AiField
                  label="车牌/轨迹"
                  value={data.track_id}
                  mono
                />
                <AiField
                  label="置信度"
                  value={formatPercent(data.confidence)}
                  mono
                  tone={data.confidence >= 0.85 ? 'brand' : data.confidence >= 0.6 ? 'warning' : 'danger'}
                />
                <AiField
                  label="车型"
                  value={formatVehicleClass(data.vehicle_class)}
                />
                <AiField
                  label="颜色"
                  value="--"
                />
              </div>
            </div>
          </SurfacePanel>

          {/* ─── Incident Timeline ─── */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-outline-variant/10 bg-surface-container px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">timeline</span>
                <span className="text-sm font-semibold text-on-surface">事件时间线</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-4 border-l border-outline-variant/50 ml-1 pl-4">
                {timeline.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div
                      className={cn(
                        'absolute -left-[22px] top-0.5 w-3 h-3 rounded-full ring-4 ring-surface-container-low',
                        entry.tone === 'brand' && 'bg-primary',
                        entry.tone === 'warning' && 'bg-secondary',
                        entry.tone === 'danger' && 'bg-error',
                        entry.tone === 'muted' && 'bg-outline-variant',
                      )}
                    />
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'text-label-xs font-bold',
                          entry.tone === 'brand' && 'text-primary',
                          entry.tone === 'warning' && 'text-secondary',
                          entry.tone === 'danger' && 'text-error',
                          entry.tone === 'muted' && 'text-on-surface-variant',
                        )}
                      >
                        {entry.time}
                      </span>
                      <span
                        className={cn(
                          'text-body-sm',
                          entry.tone === 'muted' ? 'text-on-surface-variant opacity-50' : 'text-on-surface',
                        )}
                      >
                        {entry.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SurfacePanel>

          {/* ─── Location Context ─── */}
          {data.gps_location && typeof data.gps_location.lat === 'number' && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-outline-variant/10 bg-surface-container px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span className="text-sm font-semibold text-on-surface">位置上下文</span>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-end justify-between">
                  <span className="text-label-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    GPS 坐标
                  </span>
                  <span className="font-mono-data text-xs text-primary">{gpsText}</span>
                </div>
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">map</span>
                    <p className="mt-2 text-label-xs text-on-surface-variant">{gpsText}</p>
                  </div>
                </div>
              </div>
            </SurfacePanel>
          )}

          {/* ─── Response actions ─── */}
          {data.review_status === 'pending' && (canReview || canAssign) && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-outline-variant/10 bg-surface-container px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">rule</span>
                  <span className="text-sm font-semibold text-on-surface">处置动作</span>
                </div>
              </div>
              <div className="grid gap-2 p-4">
                {canReview && (
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 text-body-sm font-bold text-on-primary-container transition-all hover:brightness-110 active:scale-95"
                    onClick={() => void handleReview('validated', '从事件详情确认占用', user?.display_name)}
                  >
                    <span className="material-symbols-outlined text-base">gavel</span>
                    确认违规
                  </button>
                )}
                {canAssign && (
                  <div className="rounded-lg border border-outline-variant/20 bg-surface-container p-3">
                    <div className="grid gap-2">
                      <label className="grid gap-1 text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        巡查员
                        <select
                          className={selectClassName('w-full normal-case tracking-normal')}
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                        >
                          {assignees.map((assignee) => (
                            <option key={assignee.username} value={assignee.username}>
                              {assignee.display_name} ({assignee.username})
                            </option>
                          ))}
                        </select>
                      </label>
                      <input
                        className={inputClassName('w-full')}
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        placeholder="派发备注"
                      />
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 text-body-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!selectedAssignee || assigning}
                        onClick={() => void assignToPatrol()}
                      >
                        <span className="material-symbols-outlined text-base">assignment_ind</span>
                        派发给巡查员
                      </button>
                    </div>
                  </div>
                )}
                {canReview && (
                  <button
                    type="button"
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/20 px-4 py-2.5 text-body-sm text-on-surface-variant transition-all hover:border-error/30 hover:bg-error-container/10 hover:text-error active:opacity-80"
                    onClick={() => void handleReview('false_alarm', '从事件详情标记为误报', user?.display_name)}
                  >
                    <span className="material-symbols-outlined text-base">block</span>
                    无效/误报
                  </button>
                )}
              </div>
            </SurfacePanel>
          )}

          {/* ─── Review Panel (existing) ─── */}
          <ReviewPanel
            reviewStatus={data.review_status}
            operatorNote={data.operator_note}
            onSubmit={handleReview}
            submitting={submitting}
            operatorName={user?.display_name ?? 'Aegis 操作员'}
          />

          {/* ─── Review History ─── */}
          <ReviewHistory history={data.review_history} />
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FieldChip({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
      {typeof value === 'string' ? (
        <span className={cn('rounded-md bg-surface-container px-sm py-xs text-label-xs font-medium', mono ? 'font-mono-data text-primary' : 'text-on-surface')}>{value}</span>
      ) : value}
    </div>
  );
}

function AiField({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'brand' | 'warning' | 'danger';
}) {
  return (
    <div className="min-w-0 rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2.5">
      <span className="block text-[10px] font-semibold uppercase leading-none tracking-wider text-on-surface-variant">{label}</span>
      <span
        className={cn(
          'mt-2 block min-w-0 leading-5',
          mono ? 'break-all font-mono-data text-body-sm' : 'truncate text-body-sm',
          tone === 'brand' && 'text-primary',
          tone === 'warning' && 'text-secondary',
          tone === 'danger' && 'text-error',
          !tone && 'text-on-surface',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function formatVehicleClass(value: string) {
  const labels: Record<string, string> = {
    car: '轿车',
    truck: '货车',
    bus: '客车',
    motorcycle: '摩托车',
  };
  return labels[value] ?? value;
}

function ReviewHistory({ history }: { history: ReviewHistoryItem[] }) {
  if (history.length === 0) {
    return (
      <SurfacePanel className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-base text-primary">history</span>
          复核历史
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-outline-variant/20 bg-surface-container p-4">
          <span className="material-symbols-outlined text-lg text-on-surface-variant">history</span>
          <p className="text-sm leading-6 text-on-surface-variant">
            暂无复核记录。完成复核后会记录操作员决策。
          </p>
        </div>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel className="p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
        <span className="material-symbols-outlined text-base text-primary">history</span>
        复核历史
        <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono-data text-[10px] text-on-surface-variant">
          {history.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-outline-variant/10 bg-surface-container p-3.5 transition-all hover:border-primary/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-mono-data text-[10px] font-semibold text-primary">
                    {item.operator_id.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-on-surface">{item.operator_id}</span>
              </div>
              <span className="font-mono-data text-[11px] text-on-surface-variant">
                {formatFullDateTime(item.reviewed_at)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={item.from_status} />
              <span className="material-symbols-outlined text-sm text-on-surface-variant">arrow_forward</span>
              <StatusBadge status={item.to_status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {item.operator_note || (
                <span className="italic text-on-surface-variant opacity-50">未填写备注</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
