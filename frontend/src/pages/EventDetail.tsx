import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { useToast } from '../hooks/useToast';
import type { EventDetail as EventDetailType, ReviewHistoryItem } from '../types';
import { cn, formatFullDateTime, formatPercent } from '../utils/format';

function formatGpsLocation(gps: unknown): string {
  if (!gps || typeof gps !== 'object') return '无';
  const location = gps as { lat?: unknown; lng?: unknown };
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return '无';
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

/* ─── Timeline builder ─── */
interface TimelineEntry {
  id: string;
  label: string;
  time: string;
  icon: React.ReactNode;
  tone: 'brand' | 'warning' | 'danger' | 'muted';
}

function buildTimeline(data: EventDetailType): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: 'detection',
      label: '系统检测',
      time: formatFullDateTime(data.start_time),
      icon: <Camera className="h-3.5 w-3.5" />,
      tone: 'brand',
    },
    {
      id: 'alert',
      label: '告警生成',
      time: formatFullDateTime(data.created_at),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tone: 'warning',
    },
  ];

  if (data.review_status === 'confirmed') {
    entries.push({
      id: 'confirmed',
      label: '复核确认',
      time: formatFullDateTime(data.reviewed_at),
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      tone: 'brand',
    });
  } else if (data.review_status === 'rejected') {
    entries.push({
      id: 'rejected',
      label: '复核驳回',
      time: formatFullDateTime(data.reviewed_at),
      icon: <X className="h-3.5 w-3.5" />,
      tone: 'danger',
    });
  } else {
    entries.push({
      id: 'pending',
      label: '等待复核',
      time: '—',
      icon: <Clock className="h-3.5 w-3.5" />,
      tone: 'muted',
    });
  }

  return entries;
}

/* ─── Main component ─── */
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);

  const timeline = useMemo(() => (data ? buildTimeline(data) : []), [data]);

  if (loading) return <StateBlock tone="loading" title="正在加载事件详情" description="同步证据、结构化字段和复核状态。" />;
  if (error) {
    return (
      <StateBlock
        tone="error"
        title={error.includes('不存在') ? '事件不存在' : '事件详情加载失败'}
        description={error}
        action={
          <PrimaryButton
            icon={error.includes('不存在') ? ArrowLeft : RefreshCw}
            onClick={() => (error.includes('不存在') ? navigate('/events') : refetch())}
          >
            {error.includes('不存在') ? '返回事件列表' : '重试'}
          </PrimaryButton>
        }
      />
    );
  }
  if (!data) return null;

  const handleReview = async (status: string, note: string, operatorId: string): Promise<boolean> => {
    const ok = await submit(status, note, operatorId);
    if (ok) {
      showToast(status === 'confirmed' ? '已确认占用，复核结果已保存' : '已驳回事件，复核结果已保存', 'success');
      refetch();
    }
    return ok;
  };

  const gpsText = formatGpsLocation(data.gps_location);
  const trafficIconClass = 'text-[var(--muted)] text-lg material-symbols-outlined';

  return (
    <div className="space-y-6">
      {/* ─── Page header ─── */}
      <PageHeader
        eyebrow="INCIDENT REVIEW"
        title="事件复核"
        description="先看证据链，再核对结构化字段，最后完成复核。"
        action={
          <>
            <PrimaryButton tone="light" icon={ArrowLeft} onClick={() => navigate('/review')}>
              返回队列
            </PrimaryButton>
            {data.next_event_id && (
              <PrimaryButton icon={ArrowRight} href={`/events/${data.next_event_id}`}>
                下一条
              </PrimaryButton>
            )}
          </>
        }
      />

      {/* ─── Incident badge bar ─── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)] p-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">事件 ID</span>
          <span className="rounded-md bg-[var(--surface-base)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--brand)]">
            {data.event_id}
          </span>
        </div>
        <div className="h-4 w-px bg-[var(--line)]/30" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">设备</span>
          <span className="font-mono text-xs text-[var(--text)]">{data.device_id}</span>
        </div>
        <div className="h-4 w-px bg-[var(--line)]/30" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">优先级</span>
          <StatusBadge status={data.risk_level ?? 'normal'} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">复核状态</span>
          <StatusBadge status={data.review_status} />
        </div>
      </div>

      {/* ─── Action banner ─── */}
      <ActionPanel
        tone={data.review_status === 'pending' ? 'warning' : 'success'}
        title={data.review_status === 'pending' ? '下一步：完成此事件复核' : '此事件已复核'}
        description={
          data.review_status === 'pending'
            ? data.review_priority_reason ?? '请根据证据链作出确认或驳回。'
            : '可以继续查看下一条，或返回复核队列。'
        }
        action={
          data.review_status === 'pending' ? (
            <StatusBadge status={data.risk_level ?? 'normal'} />
          ) : (
            <PrimaryButton href="/review">回到复核队列</PrimaryButton>
          )
        }
      />

      {/* ─── Main split layout ─── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ════════════ LEFT: EVIDENCE ════════════ */}
        <section className="space-y-5">
          {/* Video player / evidence viewer */}
          <div className="overflow-hidden rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)]">
            {/* Camera label bar */}
            <div className="flex items-center justify-between border-b border-[var(--line)]/10 bg-[var(--surface-base)] px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base text-[var(--muted)]">videocam</span>
                <span className="text-xs font-medium text-[var(--text)]">{data.device_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--danger)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--danger)] shadow-[0_0_6px_var(--danger)]" />
                  LIVE
                </span>
                <span className="rounded-md bg-[var(--brand-soft)]/10 px-2 py-0.5 font-mono text-[11px] text-[var(--brand)]">
                  {data.roi_id}
                </span>
              </div>
            </div>

            {/* Media player */}
            <EvidenceViewer files={data.evidence_files} summary={data.evidence_summary} />
          </div>

          {/* Evidence snapshot thumbnails grid */}
          {data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  证据快照
                </span>
                <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                  {data.evidence_files.filter((f) => f.mime_type.startsWith('image/')).length} 张
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {data.evidence_files
                  .filter((f) => f.mime_type.startsWith('image/'))
                  .map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video overflow-hidden rounded-lg border border-[var(--line)]/10 bg-[var(--surface-base)]"
                    >
                      <img
                        src={file.url}
                        alt={file.evidence_type}
                        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-200 group-hover:bg-black/40">
                        <span className="material-symbols-outlined text-2xl text-white opacity-0 transition duration-200 group-hover:opacity-100">
                          zoom_in
                        </span>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
                        {file.evidence_type === 'frame_peak'
                          ? '峰值帧'
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

          {/* Video clip indicator */}
          {data.evidence_files.some((f) => f.mime_type.startsWith('video/')) && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--line)]/10 bg-[var(--surface-soft)] px-4 py-3">
              <Play className="h-5 w-5 text-[var(--brand)]" />
              <div>
                <div className="text-sm font-medium text-[var(--text)]">包含视频片段</div>
                <div className="text-xs text-[var(--muted)]">可在上方播放器中查看完整视频证据</div>
              </div>
            </div>
          )}
        </section>

        {/* ════════════ RIGHT SIDEBAR ════════════ */}
        <aside className="space-y-5">
          {/* ─── AI Recognition panel ─── */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-[var(--line)]/10 bg-[var(--surface-base)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--brand)]">manufacturing</span>
                <span className="text-sm font-semibold text-[var(--text)]">AI 识别</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <AiField
                  label="车牌号"
                  value={data.track_id}
                  mono
                  icon={<span className={trafficIconClass}>confirmation_number</span>}
                />
                <AiField
                  label="置信度"
                  value={formatPercent(data.confidence)}
                  mono
                  tone={data.confidence >= 0.85 ? 'brand' : data.confidence >= 0.6 ? 'warning' : 'danger'}
                  icon={<span className={trafficIconClass}>signal_cellular_alt</span>}
                />
                <AiField
                  label="车辆类型"
                  value={data.vehicle_class === 'car' ? '轿车' : data.vehicle_class === 'truck' ? '卡车' : data.vehicle_class === 'bus' ? '客车' : data.vehicle_class === 'motorcycle' ? '摩托车' : data.vehicle_class}
                  icon={<span className={trafficIconClass}>directions_car</span>}
                />
                <AiField
                  label="轨迹 ID"
                  value={data.track_id}
                  mono
                  icon={<span className={trafficIconClass}>pin</span>}
                />
                <AiField
                  label="持续时长"
                  value={`${data.duration_seconds} 秒`}
                  mono
                  icon={<span className={trafficIconClass}>timer</span>}
                />
                <AiField
                  label="GPS 坐标"
                  value={gpsText}
                  mono
                  icon={<span className={trafficIconClass}>location_on</span>}
                />
              </div>
            </div>
          </SurfacePanel>

          {/* ─── Timeline ─── */}
          <SurfacePanel className="overflow-hidden">
            <div className="border-b border-[var(--line)]/10 bg-[var(--surface-base)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--brand)]">timeline</span>
                <span className="text-sm font-semibold text-[var(--text)]">事件时间线</span>
              </div>
            </div>
            <div className="p-4">
              <div className="relative space-y-0">
                {timeline.map((entry, idx) => {
                  const isLast = idx === timeline.length - 1;
                  return (
                    <div key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                      {/* Vertical line */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-5 h-full w-px bg-[var(--line)]/20" />
                      )}
                      {/* Dot */}
                      <div
                        className={cn(
                          'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                          entry.tone === 'brand' && 'bg-[var(--brand-soft)]/20 text-[var(--brand)]',
                          entry.tone === 'warning' && 'bg-[var(--warning-soft)]/20 text-[var(--warning)]',
                          entry.tone === 'danger' && 'bg-[var(--danger-soft)]/20 text-[var(--danger)]',
                          entry.tone === 'muted' && 'bg-[var(--surface-raised)] text-[var(--muted)]',
                        )}
                      >
                        {entry.icon}
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[var(--text)]">{entry.label}</span>
                          <span className="shrink-0 font-mono text-[11px] text-[var(--muted)]">{entry.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SurfacePanel>

          {/* ─── Location map placeholder ─── */}
          {data.gps_location && typeof data.gps_location.lat === 'number' && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-[var(--line)]/10 bg-[var(--surface-base)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--brand)]" />
                  <span className="text-sm font-semibold text-[var(--text)]">位置</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--line)]/10 bg-[var(--surface-base)]">
                  <MapPin className="h-6 w-6 text-[var(--brand)]" />
                </div>
                <div>
                  <div className="font-mono text-xs text-[var(--text)]">{gpsText}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">设备上报位置</div>
                </div>
              </div>
            </SurfacePanel>
          )}

          {/* ─── Review actions ─── */}
          {data.review_status === 'pending' && (
            <SurfacePanel className="overflow-hidden">
              <div className="border-b border-[var(--line)]/10 bg-[var(--surface-base)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[var(--brand)]">gavel</span>
                  <span className="text-sm font-semibold text-[var(--text)]">快速操作</span>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-soft)]/30 bg-[var(--brand-soft)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--brand)] transition-all hover:bg-[var(--brand-soft)]/20 active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  确认占用
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition-all hover:border-[var(--line-strong)] hover:bg-[var(--surface-glow)] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base">assignment_ind</span>
                  指派巡逻
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-[var(--muted)] transition-all hover:text-[var(--danger)] active:scale-[0.98]"
                >
                  <X className="h-4 w-4" />
                  无效 / 误报
                </button>
              </div>
            </SurfacePanel>
          )}

          {/* ─── Review Panel (existing) ─── */}
          <ReviewPanel
            reviewStatus={data.review_status}
            operatorNote={data.operator_note}
            onSubmit={handleReview}
            submitting={submitting}
          />

          {/* ─── Event Fields (existing) ─── */}
          <SurfacePanel className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <span className="material-symbols-outlined text-base text-[var(--brand)]">database</span>
              事件字段
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <Field label="事件 ID" value={data.event_id} mono />
              <Field label="设备" value={data.device_id} />
              <Field label="开始时间" value={formatFullDateTime(data.start_time)} />
              <Field label="结束时间" value={formatFullDateTime(data.end_time)} />
              <Field label="持续时长" value={`${data.duration_seconds} 秒`} />
              <Field label="轨迹 ID" value={data.track_id} />
              <Field label="车辆类别" value={data.vehicle_class} />
              <Field label="置信度" value={formatPercent(data.confidence)} />
              <Field label="GPS" value={gpsText} />
              <div className="flex items-center justify-between border-t border-[var(--line)]/20 pt-2">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">状态</span>
                <StatusBadge status={data.review_status} />
              </div>
            </div>
          </SurfacePanel>

          {/* ─── Review History ─── */}
          <ReviewHistory history={data.review_history} />
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function AiField({
  label,
  value,
  mono,
  tone,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'brand' | 'warning' | 'danger';
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)]/10 bg-[var(--surface-base)] p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      </div>
      <div
        className={cn(
          'mt-1 font-medium',
          mono && 'font-mono text-xs',
          tone === 'brand' && 'text-[var(--brand)]',
          tone === 'warning' && 'text-[var(--warning)]',
          tone === 'danger' && 'text-[var(--danger)]',
          !tone && 'text-[var(--text)]',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ReviewHistory({ history }: { history: ReviewHistoryItem[] }) {
  if (history.length === 0) {
    return (
      <SurfacePanel className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <History className="h-4 w-4 text-[var(--brand)]" />
          复核历史
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-[var(--line)]/20 bg-[var(--surface-base)] p-4">
          <History className="h-5 w-5 shrink-0 text-[var(--muted)]" />
          <p className="text-sm leading-6 text-[var(--muted)]">
            尚无复核记录。下一步：完成确认或驳回后，这里会记录操作者和改判轨迹。
          </p>
        </div>
      </SurfacePanel>
    );
  }

  return (
    <SurfacePanel className="p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <History className="h-4 w-4 text-[var(--brand)]" />
        复核历史
        <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 font-mono text-[10px] text-[var(--muted)]">
          {history.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--line)]/10 bg-[var(--surface-base)] p-3.5 transition-all hover:border-[var(--brand)]/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-soft)]/10">
                  <span className="font-mono text-[10px] font-semibold text-[var(--brand)]">
                    {item.operator_id.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--text)]">{item.operator_id}</span>
              </div>
              <span className="font-mono text-[11px] text-[var(--muted)]">{formatFullDateTime(item.reviewed_at)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={item.from_status} />
              <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)]" />
              <StatusBadge status={item.to_status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {item.operator_note || <span className="italic text-[var(--faint)]">未填写备注</span>}
            </p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--line)]/15 pb-2 last:border-b-0">
      <span className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className={`text-right text-[var(--text)] ${mono ? 'font-mono text-xs' : 'text-sm'}`}>{value}</span>
    </div>
  );
}
