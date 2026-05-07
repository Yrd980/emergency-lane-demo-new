import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import { usePolling } from '../hooks/usePolling';
import type { SystemStatus } from '../types';
import { formatBytes, formatDateTime } from '../utils/format';

export default function Health() {
  const { data, loading, error, refetch } = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (loading) return <StateBlock tone="loading" title="Checking system health" description="Syncing backend, database, evidence directory, and device heartbeats." />;
  if (error) return <StateBlock tone="error" title="Health check failed" description={error} action={<PrimaryButton icon="refresh" onClick={refetch}>Retry Check</PrimaryButton>} />;
  if (!data) return null;

  const topIssue = data.issues[0];

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="SYSTEM HEALTH"
        title="System Health"
        description="Before long-running use, first confirm the system can keep running, then proceed to event review."
        action={<PrimaryButton icon="refresh" onClick={refetch}>Refresh Now</PrimaryButton>}
      />

      <ActionPanel
        tone={topIssue ? (topIssue.severity === 'critical' ? 'danger' : 'warning') : 'success'}
        title={topIssue ? topIssue.message : 'No blocking issues'}
        description={topIssue ? topIssue.next_action : 'Next: return to workbench or continue processing pending reviews.'}
        action={<PrimaryButton href={topIssue?.code === 'pending_reviews' ? '/review' : '/'}>{topIssue ? 'Handle Next Step' : 'Back to Workbench'}</PrimaryButton>}
      />

      <div className="mt-lg grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Backend" value={data.backend.status} tone="success" helper={formatDateTime(data.server_time)} />
        <MetricTile label="Online Devices" value={`${data.devices.online}/${data.devices.total}`} tone={data.devices.online > 0 ? 'success' : 'warning'} helper="By heartbeat window" />
        <MetricTile label="Pending Review" value={data.events.pending_review_count} tone={data.events.pending_review_count > 0 ? 'warning' : 'neutral'} helper="Review workbench queue" />
        <MetricTile label="Evidence Usage" value={formatBytes(data.evidence.usage_bytes)} helper={`${data.evidence.file_count} files`} />
      </div>

      <div className="mt-lg grid gap-4 lg:grid-cols-2">
        <HealthCard icon="dns" title="FastAPI Backend" status={data.backend.status} body="Handles event ingestion, review state, and web queries." next="Check uvicorn stderr on anomaly." />
        <HealthCard icon="database" title="SQLite Database" status={data.database.status} body={data.database.path} next="Check DB_PATH and write permissions on anomaly." />
        <HealthCard icon="folder" title="Evidence Directory" status={data.evidence.status} body={data.evidence.dir} next="Configure cleanup policy for long-running use." />
        <HealthCard icon="smartphone" title="Android Devices" status={data.devices.online > 0 ? 'ok' : 'warning'} body={`${data.devices.pending_upload_count} uploads backlogged`} next="Enter device detail to diagnose on backlog." />
      </div>
    </div>
  );
}

function HealthCard({ icon, title, status, body, next }: { icon: string; title: string; status: string; body: string; next: string }) {
  const ok = status === 'ok';
  return (
    <SurfacePanel className="p-4 transition-all hover:border-primary/20 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant/10 bg-surface-container">
            <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-on-surface">{title}</span>
              {ok ? (
                <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(194,193,255,0.5)] status-dot-healthy" />
              ) : (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-error shadow-[0_0_6px_rgba(255,180,171,0.5)] status-dot-critical" />
              )}
            </div>
            <div className="mt-1 text-body-sm text-on-surface-variant">{body}</div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-label-xs font-label-xs uppercase tracking-wider ${
            ok ? 'bg-primary/10 text-primary' : 'bg-error-container/10 text-error'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">
        <span className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Next: </span>
        {next}
      </div>
    </SurfacePanel>
  );
}
