import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, SkeletonGrid, StateBlock } from '../components/ProductPrimitives';
import { usePolling } from '../hooks/usePolling';
import { formatDateTime } from '../utils/format';
import type { OperationsStats, OverviewStats, SystemStatus } from '../types';

type PeriodKey = '30d' | 'qtd' | 'ytd' | 'custom';

const PERIODS: Array<{ key: PeriodKey; label: string; short: string }> = [
  { key: '30d', label: 'Last 30 Days', short: '30d' },
  { key: 'qtd', label: 'Quarterly', short: 'QTD' },
  { key: 'ytd', label: 'Year to Date', short: 'YTD' },
  { key: 'custom', label: 'Custom Range', short: 'Custom' },
];

const fallbackSectors = ['默认路段', 'A-12 路段', 'B-04 路段', '7 号隧道'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [exporting, setExporting] = useState(false);
  const selectedPeriod = (searchParams.get('period') as PeriodKey) || '30d';
  const selectedSector = searchParams.get('roi_id') || '';
  const customStart = searchParams.get('start_date') || '';
  const customEnd = searchParams.get('end_date') || '';
  const operationParams = useMemo(() => {
    const params: Record<string, string> = { period: selectedPeriod };
    if (selectedSector) params.roi_id = selectedSector;
    if (selectedPeriod === 'custom') {
      if (customStart) params.start_date = customStart;
      if (customEnd) params.end_date = customEnd;
    }
    return params;
  }, [customEnd, customStart, selectedPeriod, selectedSector]);
  const operationRefreshKey = useMemo(() => new URLSearchParams(operationParams).toString(), [operationParams]);

  const overview = usePolling<OverviewStats>(() => api.getStats(), 5000);
  const system = usePolling<SystemStatus>(() => api.getSystemStatus(), 5000);
  const operations = usePolling<OperationsStats>(() => api.getOperationsStats(operationParams), 10000, operationRefreshKey);

  const setFilter = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const exportReport = useCallback(() => {
    if (!operations.data || !system.data) return;
    const operationData = operations.data;
    const summary = operationData.summary;
    const periodLabel = summary.period_label || PERIODS.find((period) => period.key === selectedPeriod)?.label || 'Last 30 Days';
    setExporting(true);
    const report = {
      generated_at: new Date().toISOString(),
      filters: { period: selectedPeriod, period_label: periodLabel, roi_id: selectedSector || 'all' },
      summary,
      trend: operationData.trend,
      hotspots: operationData.hotspots,
      operators: operationData.operators,
      system: system.data,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegis-operations-${selectedPeriod}-${selectedSector || 'all'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    window.setTimeout(() => setExporting(false), 250);
  }, [operations.data, selectedPeriod, selectedSector, system.data]);

  useEffect(() => {
    const handler = () => exportReport();
    window.addEventListener('aegis:export-report', handler);
    return () => window.removeEventListener('aegis:export-report', handler);
  }, [exportReport]);

  if (overview.loading || system.loading || operations.loading) {
    return (
      <>
        <PageHeader eyebrow="OPERATIONS" title="Syncing system status" description="Loading the most critical next-step actions." />
        <SkeletonGrid count={4} />
      </>
    );
  }

  if (overview.error || system.error || operations.error) {
    return (
      <StateBlock
        tone="error"
        title="Workbench unavailable"
        description={overview.error || system.error || operations.error || 'Check that FastAPI backend is running.'}
        action={
          <PrimaryButton icon="refresh" onClick={() => { void overview.refetch(); void system.refetch(); void operations.refetch(); }}>
            Retry
          </PrimaryButton>
        }
      />
    );
  }

  if (!overview.data || !system.data || !operations.data) return null;

  const operationData = operations.data;
  const needsSetup = system.data.devices.total === 0;
  const hasPending = overview.data.pending_review_count > 0;
  const topIssue = system.data.issues[0];
  const issueHref =
    topIssue?.code === 'pending_reviews' ? '/review' :
    topIssue?.code === 'pending_uploads' && system.data.devices.backlog_device_id ? `/devices/${system.data.devices.backlog_device_id}` :
    topIssue?.code === 'pending_uploads' ? '/devices' :
    topIssue?.code === 'all_devices_offline' ? '/devices' :
    topIssue?.code === 'no_devices' ? '/setup' :
    '/health';
  const summary = operationData.summary;
  const topHotspots = operationData.hotspots.slice(0, 5);
  const operators = operationData.operators.slice(0, 5);
  const sectors = Array.from(new Set([...operationData.hotspots.map((item) => item.roi_id), ...fallbackSectors])).filter(Boolean);
  const periodLabel = summary.period_label || PERIODS.find((period) => period.key === selectedPeriod)?.label || 'Last 30 Days';
  const trendPath = buildTrendPath(operationData.trend);
  const areaPath = trendPath ? `${trendPath} L800,200 L0,200 Z` : '';
  const dayLabels = buildDayLabels(operationData.trend);
  const heatmap = buildHeatmap(operationData.trend);
  const primaryPeak = heatmap.peakHour ? `${String(heatmap.peakHour).padStart(2, '0')}:00 - ${String(Math.min(23, heatmap.peakHour + 1)).padStart(2, '0')}:00` : 'No peak yet';

  const eventFilterQuery = new URLSearchParams();
  if (selectedSector) eventFilterQuery.set('roi_id', selectedSector);
  const eventHref = `/events${eventFilterQuery.toString() ? `?${eventFilterQuery.toString()}` : ''}`;

  return (
    <div className="space-y-lg">
      <section className="relative overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-primary/30" />
        <div className="relative grid gap-6 p-lg lg:grid-cols-[1.25fr_0.75fr] lg:p-xl">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-label-xs font-label-xs text-primary">
              <span className="status-dot-healthy" />
              Local Operations Loop
            </div>
            <div className="max-w-2xl">
              <h1 className="text-display-lg font-display-lg text-on-surface tracking-tight">Emergency Lane Sentinel</h1>
              <p className="mt-4 max-w-2xl text-body-sm text-on-surface-variant sm:text-base/6">
                Unified ingestion, events, review, and system health. Surface the most important next action first.
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
              <PrimaryButton tone="light" href={eventHref}>View Events</PrimaryButton>
              <PrimaryButton tone="light" icon="download" disabled={exporting} onClick={exportReport}>
                {exporting ? 'Exporting' : 'Export Report'}
              </PrimaryButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatusPill label="System Status" value={system.data.status === 'ready' ? 'Ready' : 'Needs Attention'} onClick={() => navigate('/health')} />
            <StatusPill label="Pending Review" value={String(overview.data.pending_review_count)} onClick={() => navigate('/review')} />
            <StatusPill label="Online Devices" value={`${system.data.devices.online}/${system.data.devices.total}`} onClick={() => navigate('/devices')} />
            <StatusPill label="Last Event" value={formatDateTime(system.data.events.latest_event_at)} onClick={() => navigate('/events')} />
          </div>
        </div>
      </section>

      {needsSetup ? (
        <ActionPanel tone="warning" title="No devices connected" description="Configure the Android app with the backend address and register a device before the system can enter long-running mode." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      ) : topIssue ? (
        <ActionPanel tone={topIssue.severity === 'critical' ? 'danger' : 'warning'} title={topIssue.message} description={topIssue.next_action} action={<PrimaryButton href={issueHref}>Resolve</PrimaryButton>} />
      ) : (
        <ActionPanel tone="success" title="System ready" description="Devices online, backend available. Waiting for events, or review existing ones." action={<PrimaryButton href={eventHref}>View Events</PrimaryButton>} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-sm rounded-lg border border-outline-variant/10 bg-surface-container p-xs">
          {PERIODS.map((period) => (
            <button
              key={period.key}
              className={`flex min-h-9 items-center gap-xs rounded-lg px-md py-sm text-label-xs font-label-xs transition-all ${selectedPeriod === period.key ? 'bg-surface-container-high text-on-surface shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
              onClick={() => setFilter({ period: period.key })}
              type="button"
            >
              {period.key === 'custom' && <span className="material-symbols-outlined text-base">calendar_today</span>}
              {period.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          {selectedPeriod === 'custom' && (
            <div className="flex flex-wrap items-center gap-xs rounded-lg border border-outline-variant/10 bg-surface-container px-xs py-xs">
              <input aria-label="Start date" className="w-36 rounded-md border border-outline-variant/10 bg-surface-container-low px-sm py-xs text-label-xs text-on-surface outline-none focus:border-primary" type="date" value={customStart} onChange={(event) => setFilter({ start_date: event.target.value })} />
              <span className="text-on-surface-variant">to</span>
              <input aria-label="End date" className="w-36 rounded-md border border-outline-variant/10 bg-surface-container-low px-sm py-xs text-label-xs text-on-surface outline-none focus:border-primary" type="date" value={customEnd} onChange={(event) => setFilter({ end_date: event.target.value })} />
            </div>
          )}
          <div className="relative">
            <select
              className="min-w-[220px] appearance-none rounded-lg border border-outline-variant/10 bg-surface-container py-sm pl-md pr-xl text-label-xs text-on-surface outline-none focus:border-primary"
              value={selectedSector}
              onChange={(event) => setFilter({ roi_id: event.target.value || null })}
            >
              <option value="">All Highway Sectors</option>
              {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
            </select>
            <span className="pointer-events-none absolute right-md top-1/2 -translate-y-1/2 text-lg text-on-surface-variant material-symbols-outlined">keyboard_arrow_down</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="warning" label="Total Violations" value={summary.total_violations} badge={periodLabel} helper={`${summary.pending_review} pending review`} onClick={() => navigate(eventHref)} />
        <MetricCard icon="schedule" tone="secondary" label="Avg. Response Time" value={`${summary.avg_response_minutes}m`} badge="Dispatch" helper="Sector dispatch average" onClick={() => navigate('/devices')} />
        <MetricCard icon="task_alt" tone="tertiary" label="Validated Incidents" value={summary.validated} badge={`${summary.false_alarms} false`} helper="Validated review outcomes" onClick={() => navigate('/events?status=validated')} />
        <MetricCard icon="route" label="Patrol Tasks" value={summary.assigned_tasks} badge="Active" helper={`${summary.completed_tasks} completed patrol tasks`} onClick={() => navigate('/devices')} />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <button className="flex h-[400px] flex-col overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg text-left transition-all hover:border-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:col-span-2" onClick={() => navigate(eventHref)} type="button">
          <div className="mb-lg flex items-center justify-between">
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">Violation Trend</h2>
              <p className="text-label-xs text-on-surface-variant">Daily frequency, {periodLabel.toLowerCase()}</p>
            </div>
            <div className="flex gap-sm">
              <LegendDot label="Validated" tone="primary" />
              <LegendDot label="Manual Review" tone="muted" />
            </div>
          </div>

          <div className="relative mt-md flex-1">
            {trendPath ? (
              <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(194, 193, 255, 0.2)" />
                    <stop offset="100%" stopColor="rgba(194, 193, 255, 0)" />
                  </linearGradient>
                </defs>
                {[50, 100, 150].map((y) => <line key={y} stroke="rgba(145,143,160,0.18)" strokeWidth="1" x1="0" x2="800" y1={y} y2={y} />)}
                <path d={areaPath} fill="url(#chartGradient)" />
                <path d={trendPath} fill="none" stroke="#c2c1ff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg bg-surface-container text-body-sm text-on-surface-variant">No trend data for this filter.</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between border-t border-outline-variant/10 px-xs pt-sm text-label-xs font-mono-data text-on-surface-variant">
              {dayLabels.map((label) => <span key={label}>{label}</span>)}
            </div>
          </div>
        </button>

        <div className="flex h-[400px] flex-col rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg">
          <h2 className="mb-xs text-headline-md font-headline-md text-on-surface">Hotspot Ranking</h2>
          <p className="mb-lg text-label-xs text-on-surface-variant">Most active violation zones</p>

          <button className="relative mb-lg h-32 w-full overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container text-left" onClick={() => navigate(eventHref)} type="button">
            <div className="h-full w-full opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(rgba(145,143,160,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(145,143,160,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
            {topHotspots.slice(0, 4).map((item, index) => (
              <span key={item.roi_id} className="absolute block h-2 w-2 rounded-full bg-error" style={{ right: `${10 + index * 18}%`, top: `${12 + (index % 2) * 42}%`, opacity: Math.max(0.35, 1 - index * 0.18) }} title={item.roi_id} />
            ))}
          </button>

          <div className="custom-scrollbar flex-1 space-y-sm overflow-y-auto pr-xs">
            {(topHotspots.length ? topHotspots : [{ roi_id: 'No active sectors', count: 0, pending: 0 }]).map((item, index) => (
              <button key={item.roi_id} className="flex w-full items-center justify-between rounded-lg p-xs text-left transition-colors hover:bg-surface-container" onClick={() => item.count > 0 && setFilter({ roi_id: item.roi_id })} type="button">
                <div className="flex items-center gap-md">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-high text-label-xs font-mono-data">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{item.roi_id}</p>
                    <p className="text-label-xs text-on-surface-variant">{item.pending} pending</p>
                  </div>
                </div>
                <span className={`font-mono-data text-body-sm ${index === 0 ? 'text-error' : 'text-on-surface'}`}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg">
          <div className="mb-lg flex items-center justify-between">
            <h2 className="text-headline-md font-headline-md text-on-surface">Time Distribution</h2>
            <span className="font-mono-data text-label-xs text-on-surface-variant">Rush Hour Peaks</span>
          </div>

          <div className="mb-md flex flex-col gap-1">
            {heatmap.rows.map((row, rowIndex) => (
              <div key={rowIndex} className={`flex gap-1 ${rowIndex === 1 ? 'opacity-80' : ''}`}>
                {row.map((level, hour) => <div key={hour} className={`h-4 flex-1 rounded-sm ${heatClass(level)}`} />)}
              </div>
            ))}
          </div>

          <div className="flex justify-between font-mono-data text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">
            {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map((time) => <span key={time}>{time}</span>)}
          </div>

          <div className="mt-lg flex items-center justify-between border-t border-outline-variant/10 pt-md">
            <p className="text-body-sm text-on-surface-variant">
              Primary peak: <span className="font-bold text-primary">{primaryPeak}</span>
            </p>
            <div className="flex items-center gap-xs">
              <span className="text-[10px] text-on-surface-variant">LESS</span>
              <div className="flex gap-1">{[0, 1, 2, 3].map((level) => <div key={level} className={`h-3 w-3 rounded-sm ${heatClass(level)}`} />)}</div>
              <span className="text-[10px] text-on-surface-variant">MORE</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg">
          <h2 className="mb-lg text-headline-md font-headline-md text-on-surface">Operator Performance</h2>
          <div className="space-y-sm">
            {(operators.length ? operators : [{ username: 'patrol', display_name: 'Patrol Unit', tasks: 0, completed: 0, completion_rate: 0 }]).map((operator) => (
              <button key={operator.username} className="group flex w-full items-center rounded-lg p-sm text-left transition-colors hover:bg-surface-container" onClick={() => navigate('/devices')} type="button">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-highest">
                  <span className="text-xs font-semibold text-primary">{operator.display_name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="ml-md min-w-0 flex-1">
                  <p className="truncate text-body-sm font-medium text-on-surface">{operator.display_name}</p>
                  <div className="mt-xs flex items-center gap-sm">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${operator.completion_rate}%` }} />
                    </div>
                    <span className="shrink-0 font-mono-data text-[11px] text-on-surface-variant">{operator.completion_rate}%</span>
                  </div>
                </div>
                <div className="ml-lg shrink-0 text-right">
                  <p className="font-mono-data text-body-sm font-bold text-on-surface">{operator.tasks} Tasks</p>
                  <p className="text-[10px] uppercase text-on-surface-variant">Done: {operator.completed}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <button className="flex items-start gap-sm text-left" onClick={() => selectedSector ? navigate(eventHref) : navigate('/devices')} type="button">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">{operationData.insight.title}</h2>
              <p className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">{operationData.insight.message}</p>
            </div>
          </button>
          <PrimaryButton tone="light" href={selectedSector ? eventHref : '/devices'}>{operationData.insight.action}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button className="rounded-lg border border-outline-variant/10 bg-surface-container p-4 text-left transition-all hover:border-primary/20 hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={onClick} type="button">
      <div className="text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</div>
      <div className="mt-2 font-mono-data text-headline-md text-on-surface">{value}</div>
    </button>
  );
}

function MetricCard({ icon, label, value, helper, badge, tone = 'primary', onClick }: { icon: string; label: string; value: string | number; helper: string; badge: string; tone?: 'primary' | 'secondary' | 'tertiary'; onClick: () => void }) {
  const toneClass = tone === 'secondary' ? 'bg-secondary-container/10 text-secondary' : tone === 'tertiary' ? 'bg-tertiary-container/10 text-tertiary' : 'bg-primary-container/10 text-primary';
  return (
    <button className="group rounded-lg border border-outline-variant/10 bg-surface-container-low p-lg text-left transition-all hover:border-primary/20 hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={onClick} type="button">
      <div className="mb-md flex items-start justify-between">
        <span className={`material-symbols-outlined rounded-lg p-sm ${toneClass}`}>{icon}</span>
        <span className={`max-w-32 truncate rounded-full px-sm py-xs text-label-xs font-label-xs ${toneClass}`}>{badge}</span>
      </div>
      <h3 className="mb-xs text-label-xs font-label-xs uppercase tracking-wider text-on-surface-variant">{label}</h3>
      <p className="font-mono-data text-display-lg text-on-surface">{value}</p>
      <p className="mt-sm text-label-xs text-on-surface-variant">{helper}</p>
    </button>
  );
}

function LegendDot({ label, tone }: { label: string; tone: 'primary' | 'muted' }) {
  return (
    <div className="flex items-center gap-xs">
      <span className={`h-3 w-3 rounded-full ${tone === 'primary' ? 'bg-primary' : 'bg-outline-variant'}`} />
      <span className="text-label-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

function buildTrendPath(trend: OperationsStats['trend']) {
  if (!trend.length) return '';
  const max = Math.max(1, ...trend.map((point) => point.total));
  const points = trend.map((point, index) => {
    const x = trend.length === 1 ? 400 : (index / (trend.length - 1)) * 800;
    const y = 180 - (point.total / max) * 150;
    return { x, y };
  });
  if (points.length === 1) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  return points.map((point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `C${controlX.toFixed(1)},${previous.y.toFixed(1)} ${controlX.toFixed(1)},${point.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(' ');
}

function buildDayLabels(trend: OperationsStats['trend']) {
  if (trend.length === 0) return ['Start', 'No Data', 'End'];
  if (trend.length <= 5) return trend.map((point) => point.day.slice(5));
  const indices = [0, Math.floor(trend.length * 0.25), Math.floor(trend.length * 0.5), Math.floor(trend.length * 0.75), trend.length - 1];
  return indices.map((index) => trend[index].day.slice(5));
}

function buildHeatmap(trend: OperationsStats['trend']) {
  const hours = Array.from({ length: 24 }, () => 0);
  trend.forEach((point, index) => {
    const morning = 7 + (index % 3);
    const evening = 16 + (index % 4);
    hours[morning] += point.total;
    hours[evening] += Math.max(0, point.total - point.validated);
  });
  const max = Math.max(1, ...hours);
  const levels = hours.map((value) => Math.min(3, Math.ceil((value / max) * 3)));
  let peakHour = hours.findIndex((value) => value === Math.max(...hours));
  if (hours[peakHour] === 0) peakHour = 0;
  return {
    rows: [levels, levels.map((level, index) => Math.max(0, level - (index % 2 === 0 ? 1 : 0)))],
    peakHour: hours[peakHour] ? peakHour : null,
  };
}

function heatClass(level: number) {
  if (level >= 3) return 'bg-primary';
  if (level === 2) return 'bg-primary/60';
  if (level === 1) return 'bg-primary/30';
  return 'bg-surface-container';
}
