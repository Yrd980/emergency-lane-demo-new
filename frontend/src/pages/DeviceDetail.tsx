import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDeviceDetail } from '../hooks/useDeviceDetail';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceMetricSnapshot } from '../types';
import { formatDateTime } from '../utils/format';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useDeviceDetail(id!);

  if (loading) return <StateBlock tone="loading" title="正在加载设备详情" description="同步心跳、上传积压和最近事件。" />;
  if (error) return <StateBlock tone="error" title="设备详情加载失败" description={error} action={<PrimaryButton icon={RefreshCw} onClick={refetch}>重试</PrimaryButton>} />;
  if (!data) return null;

  const firstIssue = data.issues[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="DEVICE DETAIL"
        title={data.device_name}
        description="查看单台设备是否适合继续采集：心跳、性能、上传积压和最近事件。"
        action={<PrimaryButton tone="light" icon={ArrowLeft} href="/devices">返回设备</PrimaryButton>}
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
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-950">设备信息</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Field label="设备 ID" value={data.device_id} />
            <Field label="App 版本" value={data.app_version} />
            <Field label="模型版本" value={data.model_version} />
            <Field label="注册时间" value={formatDateTime(data.registered_at)} />
            <Field label="最后心跳" value={formatDateTime(data.last_seen_at)} />
          </div>
        </section>
        <MetricHistory history={data.metric_history} />
      </div>

      <div className="mt-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">最近事件</h2>
            <StatusBadge status={data.is_online ? 'online' : 'offline'} />
          </div>
          {data.recent_events.length === 0 ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">还没有事件。下一步：在 Android 端生成测试事件。</div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {data.recent_events.map((event) => (
                <Link key={event.event_id} to={`/events/${event.event_id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-slate-50">
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-900">{event.event_id}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(event.start_time)} · {event.duration_seconds} 秒</div>
                  </div>
                  <StatusBadge status={event.review_status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricHistory({ history }: { history: DeviceMetricSnapshot[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-slate-700" />
        <h2 className="font-semibold text-slate-950">指标历史</h2>
      </div>
      {history.length === 0 ? (
        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">还没有心跳指标。下一步：确认 Android 端已完成注册并开始上报心跳。</div>
      ) : (
        <div className="mt-4 space-y-3">
          {history.slice(0, 8).map((item) => (
            <div key={item.id} className="grid gap-3 rounded-md bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="font-medium text-slate-900">{formatDateTime(item.recorded_at)}</div>
                <div className="mt-1 text-xs text-slate-500">温度：{item.thermal_state} · 电量：{item.battery_level}%</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <MiniMetric label="FPS" value={item.fps} />
                <MiniMetric label="积压" value={item.pending_upload_count} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-center">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
