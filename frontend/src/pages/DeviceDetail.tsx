import { Link, useParams } from 'react-router-dom';
import { useDeviceDetail } from '../hooks/useDeviceDetail';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceMetricSnapshot } from '../types';
import { formatDateTime } from '../utils/format';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useDeviceDetail(id!);

  if (loading) return <StateBlock tone="loading" title="正在加载设备详情" description="正在同步心跳、上传积压和近期事件。" />;
  if (error) return <StateBlock tone="error" title="设备详情加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>重试</PrimaryButton>} />;
  if (!data) return null;

  const firstIssue = data.issues[0];
  const issueActionHref = firstIssue?.code === 'pending_uploads' ? '/events' : firstIssue ? '/setup' : '/events';
  const issueActionLabel = firstIssue?.code === 'pending_uploads' ? '查看近期事件' : firstIssue ? '查看配置步骤' : '查看事件';

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="设备详情"
        title={data.device_name}
        description="核查单台设备是否适合继续采集：心跳、性能、上传积压和近期事件。"
        action={<PrimaryButton tone="light" icon="arrow_back" href="/devices">返回设备列表</PrimaryButton>}
      />

      <div className="mb-lg">
        <ActionPanel
          tone={firstIssue ? (firstIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
          title={firstIssue ? firstIssue.message : '设备可继续运行'}
          description={firstIssue ? firstIssue.next_action : '下一步：查看近期事件，或返回工作台等待新事件。'}
          action={<PrimaryButton href={issueActionHref}>{issueActionLabel}</PrimaryButton>}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="在线状态" value={data.is_online ? '在线' : '离线'} tone={data.is_online ? 'success' : 'danger'} helper={`距上次心跳 ${data.seconds_since_seen} 秒`} />
        <MetricTile label="上传积压" value={data.pending_upload_count} tone={data.pending_upload_count > 0 ? 'warning' : 'neutral'} helper="设备端队列" />
        <MetricTile label="帧率" value={data.fps} helper="最近上报" />
        <MetricTile label="电量" value={`${data.battery_level}%`} helper={data.thermal_state} />
      </div>

      <div className="mt-lg grid gap-lg lg:grid-cols-[0.8fr_1.2fr]">
        <SurfacePanel className="p-4">
          <div className="mb-3">
            <h2 className="font-semibold text-on-surface">设备信息</h2>
          </div>
          <div className="space-y-3 text-body-sm">
            <Field label="设备 ID" value={data.device_id} />
            <Field label="应用版本" value={data.app_version} />
            <Field label="模型版本" value={data.model_version} />
            <Field label="注册时间" value={formatDateTime(data.registered_at)} />
            <Field label="最近心跳" value={formatDateTime(data.last_seen_at)} />
          </div>
        </SurfacePanel>
        <MetricHistory history={data.metric_history} />
      </div>

      <div className="mt-lg">
        <SurfacePanel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">近期事件</h2>
            <StatusBadge status={data.is_online ? 'online' : 'offline'} />
          </div>
          {data.recent_events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant/20 bg-surface-container p-4 text-body-sm text-on-surface-variant">暂无事件。下一步：在 Android 设备上生成测试事件。</div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {data.recent_events.map((event) => (
                <Link
                  key={event.event_id}
                  to={`/events/${event.event_id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-body-sm transition-all hover:bg-surface-container"
                >
                  <div>
                    <div className="font-mono-data text-label-xs font-semibold text-on-surface">{event.event_id}</div>
                    <div className="mt-1 text-label-xs text-on-surface-variant">
                      {formatDateTime(event.start_time)}
                      <span className="mx-1 text-outline-variant">·</span>
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
        <span className="material-symbols-outlined text-primary text-base">monitoring</span>
        <h2 className="font-semibold text-on-surface">指标历史</h2>
      </div>
      {history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant/20 bg-surface-container p-4 text-body-sm text-on-surface-variant">暂无心跳指标。下一步：确认 Android 设备已完成注册并开始上报心跳。</div>
      ) : (
        <div className="relative space-y-4">
          {history.slice(0, 8).map((item, idx) => (
            <div key={item.id} className="relative pl-6">
              {idx < Math.min(history.length, 8) - 1 && (
                <div className="absolute left-[7px] top-3 bottom-[-16px] w-px bg-gradient-to-b from-primary/40 to-transparent" />
              )}
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-surface-container-low shadow-[0_0_6px_rgba(94,92,230,0.3)]" />
              <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm transition-all hover:border-primary/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-on-surface">{formatDateTime(item.recorded_at)}</span>
                  <span className="font-mono-data text-label-xs text-on-surface-variant">{item.thermal_state}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <MiniMetric label="帧率" value={item.fps} />
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
    <div className="min-w-[60px] rounded-md border border-outline-variant/20 bg-surface-container-high px-2.5 py-1.5 text-center transition-all hover:border-primary/30">
      <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className="font-mono-data text-body-sm font-semibold text-on-surface">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/10 pb-2.5 last:border-0">
      <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="text-right font-mono-data text-body-sm text-on-surface">{value}</span>
    </div>
  );
}
