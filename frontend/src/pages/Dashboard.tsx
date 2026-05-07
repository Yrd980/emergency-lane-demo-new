import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, SkeletonGrid, StateBlock } from '../components/ProductPrimitives';
import { usePolling } from '../hooks/usePolling';
import { formatDateTime } from '../utils/format';
import type { OverviewStats, SystemStatus } from '../types';

export default function Dashboard() {
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
          <PrimaryButton icon="refresh" onClick={() => { overview.refetch(); system.refetch(); }}>
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
    <div className="space-y-lg">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-low">
        {/* Gradient border accent */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="relative grid gap-6 p-lg lg:grid-cols-[1.25fr_0.75fr] lg:p-xl">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-label-xs font-label-xs text-primary">
              <span className="status-dot-healthy" />
              Local Operations Loop
            </div>
            <div className="max-w-2xl">
              <h1 className="text-display-lg font-display-lg text-on-surface tracking-tight">
                Emergency Lane Sentinel
              </h1>
              <p className="mt-4 max-w-2xl text-body-sm text-on-surface-variant sm:text-base/6">
                Unified ingestion, events, review, and system health — surface the most important next action first.
              </p>
            </div>
            <div className="flex flex-wrap gap-sm">
              {needsSetup ? (
                <PrimaryButton href="/setup">Start Device Setup</PrimaryButton>
              ) : hasPending ? (
                <PrimaryButton href="/review">Process Next Event</PrimaryButton>
              ) : (
                <PrimaryButton href="/health">View System Health</PrimaryButton>
              )}
              <PrimaryButton tone="light" href="/events">View Events</PrimaryButton>
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

      {/* ── Priority Action Banner ── */}
      {needsSetup ? (
        <ActionPanel tone="warning" title="No devices connected" description="Configure the Android app with the backend address and register a device before the system can enter long-running mode." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      ) : topIssue ? (
        <ActionPanel tone={topIssue.severity === 'critical' ? 'danger' : 'warning'} title={topIssue.message} description={topIssue.next_action} action={<PrimaryButton href={topIssue.code === 'pending_reviews' ? '/review' : '/health'}>Resolve</PrimaryButton>} />
      ) : (
        <ActionPanel tone="success" title="System ready" description="Devices online, backend available. Waiting for events — or review existing ones." action={<PrimaryButton href="/events">View Events</PrimaryButton>} />
      )}

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm rounded-xl border border-outline-variant/10 bg-surface-container p-xs">
          <button className="rounded-lg bg-surface-container-high px-md py-sm text-label-xs font-label-xs text-on-surface shadow-sm">Last 30 Days</button>
          <button className="rounded-lg px-md py-sm text-label-xs font-label-xs text-on-surface-variant transition-all hover:bg-surface-container-high">Quarterly</button>
          <button className="rounded-lg px-md py-sm text-label-xs font-label-xs text-on-surface-variant transition-all hover:bg-surface-container-high">Year to Date</button>
          <div className="mx-xs h-4 w-px bg-outline-variant/20" />
          <button className="flex items-center gap-xs rounded-lg px-md py-sm text-label-xs font-label-xs text-on-surface-variant transition-all hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            Custom Range
          </button>
        </div>
        <div className="relative">
          <select className="min-w-[200px] appearance-none rounded-lg border border-outline-variant/10 bg-surface-container py-sm pl-md pr-xl text-label-xs text-on-surface focus:border-primary focus:ring-primary">
            <option>All Highway Sectors</option>
            <option>Sector A-12 (Northbound)</option>
            <option>Sector B-04 (Southbound)</option>
            <option>Tunnel Corridor 7</option>
          </select>
          <span className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-lg text-on-surface-variant material-symbols-outlined">keyboard_arrow_down</span>
        </div>
      </div>

      {/* ── 4-Stat Bento Grid ── */}
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {/* Total Violations */}
        <div className="group rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg transition-all hover:border-primary/20">
          <div className="mb-md flex items-start justify-between">
            <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-sm text-primary">warning</span>
            <span className="rounded-full bg-primary/10 px-sm py-xs text-label-xs font-label-xs text-primary">+12.4%</span>
          </div>
          <h3 className="mb-xs text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Total Violations</h3>
          <p className="font-mono-data text-display-lg text-on-surface">1,482</p>
          <p className="mt-sm text-label-xs text-on-surface-variant">vs. 1,318 last month</p>
        </div>

        {/* Avg. Response Time */}
        <div className="group rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg transition-all hover:border-primary/20">
          <div className="mb-md flex items-start justify-between">
            <span className="material-symbols-outlined rounded-lg bg-secondary-container/10 p-sm text-secondary">schedule</span>
            <span className="rounded-full bg-secondary/10 px-sm py-xs text-label-xs font-label-xs text-secondary">-4.2%</span>
          </div>
          <h3 className="mb-xs text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Avg. Response Time</h3>
          <p className="font-mono-data text-display-lg text-on-surface">6.4m</p>
          <p className="mt-sm text-label-xs text-on-surface-variant">Sector dispatch average</p>
        </div>

        {/* Recognition Accuracy */}
        <div className="group rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg transition-all hover:border-primary/20">
          <div className="mb-md flex items-start justify-between">
            <span className="material-symbols-outlined rounded-lg bg-tertiary-container/10 p-sm text-tertiary">psychology</span>
            <span className="rounded-full bg-tertiary/10 px-sm py-xs text-label-xs font-label-xs text-tertiary">+0.8%</span>
          </div>
          <h3 className="mb-xs text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Recognition Accuracy</h3>
          <p className="font-mono-data text-display-lg text-on-surface">99.2%</p>
          <p className="mt-sm text-label-xs text-on-surface-variant">ML Vision Engine v4.2</p>
        </div>

        {/* Year Growth */}
        <div className="group rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg transition-all hover:border-primary/20">
          <div className="mb-md flex items-start justify-between">
            <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-sm text-primary">trending_up</span>
            <span className="rounded-full bg-primary-container px-sm py-xs text-label-xs font-label-xs text-on-primary-container">Active</span>
          </div>
          <h3 className="mb-xs text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">Year Growth</h3>
          <p className="font-mono-data text-display-lg text-on-surface">24%</p>
          <p className="mt-sm text-label-xs text-on-surface-variant">Annual infrastructure load</p>
        </div>
      </div>

      {/* ── Main Analytics Row (2/3 + 1/3) ── */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Violation Trend Chart */}
        <div className="flex h-[400px] flex-col overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg lg:col-span-2">
          <div className="mb-lg flex items-center justify-between">
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">Violation Trend</h2>
              <p className="text-label-xs text-on-surface-variant">Daily frequency monitoring over 30 days</p>
            </div>
            <div className="flex gap-sm">
              <div className="flex items-center gap-xs">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-label-xs text-on-surface-variant">Confirmed</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="h-3 w-3 rounded-full bg-outline-variant" />
                <span className="text-label-xs text-on-surface-variant">Manual Review</span>
              </div>
            </div>
          </div>

          <div className="relative mt-md flex-1">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 200">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(194, 193, 255, 0.2)" />
                  <stop offset="100%" stopColor="rgba(194, 193, 255, 0)" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
              <line stroke="rgba(255,255,255,0.05)" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
              {/* Area */}
              <path d="M0,150 Q50,140 100,160 T200,100 T300,120 T400,60 T500,80 T600,40 T700,70 T800,50 L800,200 L0,200 Z" fill="url(#chartGradient)" />
              {/* Line */}
              <path d="M0,150 Q50,140 100,160 T200,100 T300,120 T400,60 T500,80 T600,40 T700,70 T800,50" fill="none" stroke="#c2c1ff" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between border-t border-outline-variant/10 px-xs pt-sm text-label-xs font-mono-data text-on-surface-variant">
              <span>Day 01</span>
              <span>Day 08</span>
              <span>Day 15</span>
              <span>Day 22</span>
              <span>Day 30</span>
            </div>
          </div>
        </div>

        {/* Hotspot Ranking */}
        <div className="flex h-[400px] flex-col rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg">
          <h2 className="mb-xs text-headline-md font-headline-md text-on-surface">Hotspot Ranking</h2>
          <p className="mb-lg text-label-xs text-on-surface-variant">Most active violation zones</p>

          {/* Map placeholder */}
          <div className="relative mb-lg h-32 w-full overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container">
            <div
              className="h-full w-full opacity-[0.08]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
            <div className="absolute right-2 top-2">
              <span className="block h-2 w-2 animate-pulse rounded-full bg-error" />
            </div>
          </div>

          {/* Rankings */}
          <div className="custom-scrollbar flex-1 space-y-md overflow-y-auto pr-xs">
            {([
              { rank: '01', name: 'Sector A-12 Tunnel', sub: 'Northbound KM 14.5', count: 412, tone: 'error' as const },
              { rank: '02', name: 'Bridge 4 Exit Ramp', sub: 'Southbound KM 02.1', count: 298, tone: 'neutral' as const },
              { rank: '03', name: 'Industrial Spur', sub: 'Eastbound KM 08.4', count: 156, tone: 'neutral' as const },
            ] as const).map((item) => (
              <div key={item.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-high text-label-xs font-mono-data">
                    {item.rank}
                  </span>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{item.name}</p>
                    <p className="text-label-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                </div>
                <span className={`font-mono-data text-body-sm ${item.tone === 'error' ? 'text-error' : 'text-on-surface'}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secondary Data Row (1/2 + 1/2) ── */}
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        {/* Time Distribution Heatmap */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg">
          <div className="mb-lg flex items-center justify-between">
            <h2 className="text-headline-md font-headline-md text-on-surface">Time Distribution</h2>
            <span className="font-mono-data text-label-xs text-on-surface-variant">Rush Hour Peaks</span>
          </div>

          {/* Heatmap grid — exact reference pattern */}
          <div className="mb-md flex flex-col gap-1">
            {/* Row 1 */}
            <div className="flex gap-1">
              {([
                'bg-surface-container', 'bg-surface-container', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary', 'bg-primary/80', 'bg-primary/40',
                'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container',
                'bg-surface-container', 'bg-surface-container', 'bg-primary/20', 'bg-primary/50', 'bg-primary', 'bg-primary/60', 'bg-primary/30',
                'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container',
              ] as const).map((cls, i) => (
                <div key={i} className={`h-4 flex-1 rounded-sm ${cls}`} />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex gap-1 opacity-80">
              {([
                'bg-surface-container', 'bg-surface-container', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80', 'bg-primary', 'bg-primary/80', 'bg-primary/50',
                'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container',
                'bg-surface-container', 'bg-surface-container', 'bg-primary/30', 'bg-primary/60', 'bg-primary/90', 'bg-primary/70', 'bg-primary/40',
                'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container', 'bg-surface-container',
              ] as const).map((cls, i) => (
                <div key={i} className={`h-4 flex-1 rounded-sm ${cls}`} />
              ))}
            </div>
          </div>

          {/* Time axis */}
          <div className="flex justify-between font-mono-data text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:59</span>
          </div>

          {/* Legend */}
          <div className="mt-lg flex items-center justify-between border-t border-outline-variant/10 pt-md">
            <p className="text-body-sm text-on-surface-variant">
              Primary peak: <span className="font-bold text-primary">08:30 - 09:15 AM</span>
            </p>
            <div className="flex items-center gap-xs">
              <span className="text-[10px] text-on-surface-variant">LESS</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-surface-container" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-primary/70" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
              </div>
              <span className="text-[10px] text-on-surface-variant">MORE</span>
            </div>
          </div>
        </div>

        {/* Operator Performance Leaderboard */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-lg">
          <h2 className="mb-lg text-headline-md font-headline-md text-on-surface">Operator Performance</h2>
          <div className="space-y-sm">
            {/* Operator 1 — Sarah J. */}
            <div className="group flex items-center rounded-lg p-sm transition-colors hover:bg-surface-container">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest">
                <span className="text-xs font-semibold text-primary">SJ</span>
              </div>
              <div className="ml-md min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-on-surface">Operator 42: Sarah J.</p>
                <div className="mt-xs flex items-center gap-sm">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-primary" style={{ width: '94%' }} />
                  </div>
                  <span className="shrink-0 font-mono-data text-[11px] text-on-surface-variant">94%</span>
                </div>
              </div>
              <div className="ml-lg shrink-0 text-right">
                <p className="font-mono-data text-body-sm font-bold text-on-surface">142 Cases</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Avg: 2.1m</p>
              </div>
            </div>

            {/* Operator 2 — Marcus W. */}
            <div className="group flex items-center rounded-lg p-sm transition-colors hover:bg-surface-container">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest">
                <span className="text-xs font-semibold text-secondary">MW</span>
              </div>
              <div className="ml-md min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-on-surface">Operator 11: Marcus W.</p>
                <div className="mt-xs flex items-center gap-sm">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-secondary" style={{ width: '89%' }} />
                  </div>
                  <span className="shrink-0 font-mono-data text-[11px] text-on-surface-variant">89%</span>
                </div>
              </div>
              <div className="ml-lg shrink-0 text-right">
                <p className="font-mono-data text-body-sm font-bold text-on-surface">128 Cases</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Avg: 2.4m</p>
              </div>
            </div>

            {/* Operator 3 — Elena F. */}
            <div className="group flex items-center rounded-lg p-sm transition-colors hover:bg-surface-container">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest">
                <span className="text-xs font-semibold text-tertiary">EF</span>
              </div>
              <div className="ml-md min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-on-surface">Operator 88: Elena F.</p>
                <div className="mt-xs flex items-center gap-sm">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-tertiary" style={{ width: '82%' }} />
                  </div>
                  <span className="shrink-0 font-mono-data text-[11px] text-on-surface-variant">82%</span>
                </div>
              </div>
              <div className="ml-lg shrink-0 text-right">
                <p className="font-mono-data text-body-sm font-bold text-on-surface">115 Cases</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Avg: 3.1m</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Glass System Insights Overlay ── */}
      <div className="fixed bottom-margin right-margin z-40 hidden md:block">
        <div className="glass-panel flex w-80 flex-col gap-sm rounded-xl border border-white/5 p-md shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h4 className="text-label-xs font-bold uppercase tracking-widest text-primary">System Insights</h4>
            </div>
            <button className="text-on-surface-variant transition-colors hover:text-on-surface" type="button">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Abnormal congestion detected at Sector A-12. AI suggests 15% increase in lane violations over next 2
            hours.
          </p>
          <button
            className="w-full rounded-lg bg-surface-container-high px-md py-sm text-label-xs font-bold text-on-surface transition-all hover:bg-surface-container-highest"
            type="button"
          >
            Optimize Patrol Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── StatusPill Sub-Component ── */
function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/5 bg-surface-container p-4">
      <div className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className="mt-2 font-mono-data text-headline-md text-on-surface">{value}</div>
    </div>
  );
}
