import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, MonitorSmartphone, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import EventTable from '../components/EventTable';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, SkeletonGrid, StateBlock, SurfacePanel } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';
import { formatDateTime } from '../utils/format';
import type { OverviewStats, SystemStatus } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const system = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);

  if (overview.loading || system.loading) {
    return (
      <>
        <PageHeader eyebrow="OPERATIONS" title="Syncing system status" description="Loading the most critical next-step actions." />
        <SkeletonGrid count={4} />
      </>
    );
  }

  if (overview.error || system.error) {
    return (
      <StateBlock
        tone="error"
        title="Workbench unavailable"
        description={overview.error || system.error || 'Check that FastAPI backend is running.'}
        action={
          <PrimaryButton
            icon={RefreshCw}
            onClick={() => {
              overview.refetch();
              system.refetch();
            }}
          >
            Retry
          </PrimaryButton>
        }
      />
    );
  }

  if (!overview.data || !system.data) return null;

  const needsSetup = system.data.devices.total === 0;
  const hasPending = overview.data.pending_review_count > 0;
  const topIssue = system.data.issues[0];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)]/10 bg-[var(--surface-soft)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-soft)]/30 bg-[var(--brand-soft)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)]">
              <span className="status-dot-healthy" />
              Local Operations Loop
            </div>
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold text-[var(--text)] tracking-tight sm:text-4xl">
                Emergency Lane Sentinel
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Unified ingestion, events, review, and system health — surface the most important next action first.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {needsSetup ? (
                <PrimaryButton href="/setup">Start Device Setup</PrimaryButton>
              ) : hasPending ? (
                <PrimaryButton href="/review">Process Next Event</PrimaryButton>
              ) : (
                <PrimaryButton href="/health">View System Health</PrimaryButton>
              )}
              <PrimaryButton tone="light" href="/events">
                View Events
              </PrimaryButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatusPill label="System Status" value={system.data.status === 'ready' ? 'Ready' : 'Needs Attention'} />
            <StatusPill label="Pending Review" value={String(overview.data.pending_review_count)} />
            <StatusPill label="Online Devices" value={`${system.data.devices.online}/${system.data.devices.total}`} />
            <StatusPill label="Last Event" value={formatDateTime(system.data.events.latest_event_at)} />
          </div>
        </div>
      </section>

      {/* Priority Action */}
      {needsSetup ? (
        <ActionPanel
          tone="warning"
          title="No devices connected"
          description="Configure the Android app with the backend address and register a device before the system can enter long-running mode."
          action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>}
        />
      ) : topIssue ? (
        <ActionPanel
          tone={topIssue.severity === 'critical' ? 'danger' : 'warning'}
          title={topIssue.message}
          description={topIssue.next_action}
          action={<PrimaryButton href={topIssue.code === 'pending_reviews' ? '/review' : '/health'}>Resolve</PrimaryButton>}
        />
      ) : (
        <ActionPanel
          tone="success"
          title="System ready"
          description="Devices online, backend available. Waiting for events — or review existing ones."
          action={<PrimaryButton href="/events">View Events</PrimaryButton>}
        />
      )}

      {/* Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Today's Events" value={overview.data.total_events_today} helper="By event start time" />
        <MetricTile label="Pending Review" value={overview.data.pending_review_count} tone={hasPending ? 'warning' : 'neutral'} helper="Primary work queue" />
        <MetricTile label="Confirmed" value={overview.data.confirmed_count} tone="success" helper="Closed loop" />
        <MetricTile label="Rejected" value={overview.data.rejected_count} tone="danger" helper="Manual exclusion" />
        <MetricTile label="Online Devices" value={`${system.data.devices.online}/${system.data.devices.total}`} helper="Recent heartbeat window" />
      </section>

      {/* Events + Health */}
      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfacePanel className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[var(--text)]">Recent Events</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Open high-priority events and complete review.</p>
            </div>
            <Link className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors" to="/events">
              All Events
            </Link>
          </div>

          {overview.data.recent_events.length === 0 ? (
            <StateBlock
              title="No events yet"
              description="After setup, generate test events from the Android device to verify the ingestion and review pipeline."
              action={<PrimaryButton href="/setup">View Setup Steps</PrimaryButton>}
            />
          ) : (
            <EventTable
              items={overview.data.recent_events.slice(0, 5)}
              total={overview.data.recent_events.length}
              offset={0}
              limit={5}
              onPage={() => navigate('/events')}
            />
          )}
        </SurfacePanel>

        <section className="space-y-4">
          <SurfacePanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[var(--text)]">System Health</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Resolve blockers first, then work the queue.</p>
              </div>
              <StatusBadge status={system.data.status === 'ready' ? 'online' : 'high'} label={system.data.status === 'ready' ? 'Operational' : 'Needs Fix'} />
            </div>
            <div className="mt-4 space-y-3">
              {system.data.issues.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg bg-[var(--brand-soft)]/10 p-3 text-sm text-[var(--brand)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  No blockers. Continue monitoring or review history.
                </div>
              ) : (
                system.data.issues.map((issue) => (
                  <div key={issue.code} className="flex gap-3 rounded-lg bg-[var(--surface)] p-3 text-sm">
                    {issue.severity === 'critical' ? <ShieldAlert className="mt-0.5 h-4 w-4 text-[var(--danger)]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--warning)]" />}
                    <div>
                      <div className="font-semibold text-[var(--text)]">{issue.message}</div>
                      <div className="mt-1 text-[var(--muted)]">{issue.next_action}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfacePanel>

          {/* Long-running Check Card */}
          <div className="rounded-xl border border-[var(--line)]/10 bg-[var(--surface-base)] p-5">
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="h-5 w-5 text-[var(--brand)]" />
              <div>
                <div className="font-semibold text-[var(--text)]">Long-Running Status</div>
                <div className="mt-1 text-sm text-[var(--muted)]">Latest event: {formatDateTime(system.data.events.latest_event_at)}</div>
              </div>
            </div>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--on-brand)] transition hover:bg-[var(--brand-strong)] active:scale-95"
              onClick={() => navigate('/health')}
            >
              View Health Details <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)]/10 bg-[var(--surface)] p-4">
      <div className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">{label}</div>
      <div className="mt-2 font-mono text-lg font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}
