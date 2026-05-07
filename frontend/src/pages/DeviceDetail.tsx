import { Link, useParams } from 'react-router-dom';
import { useDeviceDetail } from '../hooks/useDeviceDetail';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceMetricSnapshot } from '../types';
import { formatDateTime } from '../utils/format';

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useDeviceDetail(id!);

  if (loading) return <StateBlock tone="loading" title="Loading device detail" description="Syncing heartbeat, upload backlog, and recent events." />;
  if (error) return <StateBlock tone="error" title="Device detail load failed" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>Retry</PrimaryButton>} />;
  if (!data) return null;

  const firstIssue = data.issues[0];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="DEVICE DETAIL"
        title={data.device_name}
        description="Check if a single device is fit for continued collection: heartbeat, performance, upload backlog, and recent events."
        action={<PrimaryButton tone="light" icon="arrow_back" href="/devices">Back to Devices</PrimaryButton>}
      />

      <div className="mb-lg">
        <ActionPanel
          tone={firstIssue ? (firstIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
          title={firstIssue ? firstIssue.message : 'Device can continue operating'}
          description={firstIssue ? firstIssue.next_action : 'Next: check recent events, or return to workbench to wait for new events.'}
          action={<PrimaryButton href={firstIssue ? '/setup' : '/events'}>{firstIssue ? 'View Setup Steps' : 'View Events'}</PrimaryButton>}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Online Status" value={data.is_online ? 'Online' : 'Offline'} tone={data.is_online ? 'success' : 'danger'} helper={`${data.seconds_since_seen}s since heartbeat`} />
        <MetricTile label="Upload Backlog" value={data.pending_upload_count} tone={data.pending_upload_count > 0 ? 'warning' : 'neutral'} helper="Device-side queue" />
        <MetricTile label="FPS" value={data.fps} helper="Latest report" />
        <MetricTile label="Battery" value={`${data.battery_level}%`} helper={data.thermal_state} />
      </div>

      <div className="mt-lg grid gap-lg lg:grid-cols-[0.8fr_1.2fr]">
        <SurfacePanel className="p-4">
          <div className="mb-3">
            <h2 className="font-semibold text-on-surface">Device Info</h2>
          </div>
          <div className="space-y-3 text-body-sm">
            <Field label="Device ID" value={data.device_id} />
            <Field label="App Version" value={data.app_version} />
            <Field label="Model Version" value={data.model_version} />
            <Field label="Registered At" value={formatDateTime(data.registered_at)} />
            <Field label="Last Heartbeat" value={formatDateTime(data.last_seen_at)} />
          </div>
        </SurfacePanel>
        <MetricHistory history={data.metric_history} />
      </div>

      <div className="mt-lg">
        <SurfacePanel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Recent Events</h2>
            <StatusBadge status={data.is_online ? 'online' : 'offline'} />
          </div>
          {data.recent_events.length === 0 ? (
            <div className="rounded-lg border border-dashed border-outline-variant/20 bg-surface-container p-4 text-body-sm text-on-surface-variant">No events yet. Next: generate test events on the Android device.</div>
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
                      {event.duration_seconds}s
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
        <h2 className="font-semibold text-on-surface">Metric History</h2>
      </div>
      {history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-outline-variant/20 bg-surface-container p-4 text-body-sm text-on-surface-variant">No heartbeat metrics yet. Next: confirm Android device has completed registration and started heartbeat reporting.</div>
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
                  <MiniMetric label="FPS" value={item.fps} />
                  <MiniMetric label="Backlog" value={item.pending_upload_count} />
                  <MiniMetric label="Battery" value={`${item.battery_level}%`} />
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
