import { Link, useParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useDeviceDetail } from '../hooks/useDeviceDetail';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceMetricSnapshot } from '../types';
import { formatDateTime } from '../utils/format';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useDeviceDetail(id!);

  if (loading) return <StateBlock tone="loading" title="正在加载设备详情" description="同步心跳、上传积压和最近事件。" />;
  if (error) return <StateBlock tone="error" title="设备详情加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重试</PrimaryButton>} />;
  if (!data) return null;

  const firstIssue = data.issues[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="DEVICE DETAIL"
        title={data.device_name}
        description="查看单台设备是否适合继续采集：心跳、性能、上传积压和最近事件。"
        action={<PrimaryButton tone="light" icon="arrow_back" href="/devices">返回设备</PrimaryButton>}
      />

      <div className="mb-5">
        <ActionPanel
          tone={firstIssue ? (firstIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
          title={firstIssue ? firstIssue.message : '设备可以继续运行'}
          description={firstIssue ? firstIssue.next_action : '下一步：查看最近事件，或返回工作台等待新事件进入。'}
          action={<PrimaryButton href={firstIssue ? '/setup' : '/events'}>{firstIssue ? '查看接入步骤' : '查看事件'}</PrimaryButton>}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="在线状态" value={data.is_online ? '在线' : '离线'} tone={data.is_online ? 'success' : 'danger'} helper={`${data.seconds_since_seen} 秒前心跳`} />
        <MetricTile label="上传积压" value={data.pending_upload_count} tone={data.pending_upload_count > 0 ? 'warning' : 'neutral'} helper="设备侧队列" />
        <MetricTile label="FPS" value={data.fps} helper="最近上报" />
        <MetricTile label="电量" value={`${data.battery_level}%`} helper={data.thermal_state} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <SurfacePanel className="p-4">
          <div className="mb-3">
            <h2 className="font-semibold text-[var(--text)]">设备信息</h2>
          </div>
          <div className="space-y-3 text-sm">
            <Field label="设备 ID" value={data.device_id} />
            <Field label="App 版本" value={data.app_version} />
            <Field label="模型版本" value={data.model_version} />
            <Field label="注册时间" value={formatDateTime(data.registered_at)} />
            <Field label="最后心跳" value={formatDateTime(data.last_seen_at)} />
          </div>
        </SurfacePanel>
        <MetricHistory history={data.metric_history} />
      </div>

      <div className="mt-5">
        <SurfacePanel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">最近事件</h2>
            <StatusBadge status={data.is_online ? 'online' : 'offline'} />
          </div>
          {data.recent_events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--line)]/20 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">还没有事件。下一步：在 Android 端生成测试事件。</div>
          ) : (
            <div className="divide-y divide-[var(--line)]/10">
              {data.recent_events.map((event) => (
                <Link
                  key={event.event_id}
                  to={`/events/${event.event_id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-[var(--surface)]"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-[var(--text)]">{event.event_id}</div>
                    <div className="mt-1 text-xs text-[var(--faint)]">
                      {formatDateTime(event.start_time)}
                      <span className="mx-1 text-[var(--line)]">·</span>
                      {event.duration_seconds} 秒
                    </div>
                  </div>
                  <StatusBadge status={event.review_status} />
                </Link>
              ))}
            </div>
          )}
        </SurfacePanel>
      </div>
    </div>
  );
}

function MetricHistory({ history }: { history: DeviceMetricSnapshot[] }) {
  return (
    <SurfacePanel className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-[var(--brand)]" />
        <h2 className="font-semibold text-[var(--text)]">指标历史</h2>
      </div>
      {history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)]/20 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">还没有心跳指标。下一步：确认 Android 端已完成注册并开始上报心跳。</div>
      ) : (
        <div className="relative space-y-4">
          {history.slice(0, 8).map((item, idx) => (
            <div key={item.id} className="relative pl-6">
              {idx < Math.min(history.length, 8) - 1 && (
                <div className="absolute left-[7px] top-3 bottom-[-16px] w-px bg-gradient-to-b from-[var(--brand)]/40 to-transparent" />
              )}
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--brand)] bg-[var(--surface-soft)] shadow-[0_0_6px_rgba(94,92,230,0.3)]" />
              <div className="rounded-lg border border-[var(--line)]/10 bg-[var(--surface)] p-3 text-sm transition-all hover:border-[var(--brand)]/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text)]">{formatDateTime(item.recorded_at)}</span>
                  <span className="font-mono text-[11px] text-[var(--faint)]">{item.thermal_state}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <MiniMetric label="FPS" value={item.fps} />
                  <MiniMetric label="积压" value={item.pending_upload_count} />
                  <MiniMetric label="电量" value={`${item.battery_level}%`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SurfacePanel>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-[60px] rounded-md border border-[var(--line)]/20 bg-[var(--surface-raised)] px-2.5 py-1.5 text-center transition-all hover:border-[var(--brand)]/30">
      <div className="text-[10px] uppercase tracking-wider text-[var(--faint)]">{label}</div>
      <div className="font-mono text-sm font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)]/10 pb-2.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className="text-right font-mono text-sm text-[var(--text)]">{value}</span>
    </div>
  );
}
