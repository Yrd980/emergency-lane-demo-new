import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import { formatDateTime } from '../utils/format';
import type { DeviceInfo, EventListItem, OperationsStats } from '../types';

export default function DeviceStatus() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventListItem[]>([]);
  const [operations, setOperations] = useState<OperationsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getDevices(),
      api.getEvents({ limit: '8', offset: '0', sort: 'created_desc' }),
      api.getOperationsStats({ period: '30d' }),
    ])
      .then(([deviceData, eventData, operationData]) => {
        setDevices(deviceData);
        setRecentEvents(eventData.items);
        setOperations(operationData);
        setError(null);
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void Promise.resolve().then(loadDevices); }, [loadDevices]);

  const offline = devices.filter((d) => !d.is_online);
  const onlineDevices = devices.filter((d) => d.is_online);
  const onlineCount = onlineDevices.length;
  const backlog = devices.reduce((sum, d) => sum + d.pending_upload_count, 0);
  const topHotspot = operations?.hotspots[0];
  const trendBars = normalizeBars((operations?.trend ?? []).slice(-8).map((point) => point.total));
  const hotspotBars = normalizeBars((operations?.trend ?? []).slice(-8).map((point) => Math.max(0, point.total - point.validated)));
  const criticalCount = recentEvents.filter((event) => event.risk_level === 'high' || event.review_status === 'pending').length;
  const operatorsOnDuty = Math.max(onlineCount, operations?.operators.filter((operator) => operator.tasks > 0).length ?? 0);
  const operatorInitials = useMemo(
    () => (operations?.operators ?? []).slice(0, 3).map((operator) => initials(operator.display_name)),
    [operations],
  );

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="DEVICES"
        title="Device Status"
        description="Heartbeat, upload backlog, thermal state, and model version from registered Android devices."
        action={<PrimaryButton href="/setup">Add New Device</PrimaryButton>}
      />

      {error && <StateBlock tone="error" title="Device Load Failed" description={error} action={<PrimaryButton icon="refresh" onClick={loadDevices}>Retry</PrimaryButton>} />}
      {loading && <StateBlock tone="loading" title="Loading Devices" description="Syncing heartbeat, version, and upload backlog." />}
      {!loading && devices.length === 0 && !error && (
        <StateBlock title="No Devices" description="Open the setup guide, copy the backend address to the Android device to complete registration." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      )}

      {devices.length > 0 && (
        <>
          {offline.length > 0 || backlog > 0 ? (
            <ActionPanel
              tone="warning"
              title={offline.length > 0 ? `${offline.length} device(s) offline` : `${backlog} uploads backlogged`}
              description={offline.length > 0 ? 'Next: check offline device details, network, backend address, foreground service.' : 'Next: check devices with backlog, wait for retransmission or check network.'}
              action={<PrimaryButton href={offline[0] ? `/devices/${offline[0].device_id}` : '/devices'}>Investigate</PrimaryButton>}
            />
          ) : (
            <ActionPanel
              tone="success"
              title="All systems operational"
              description="Registered devices are reporting within the active heartbeat window."
              action={<PrimaryButton href="/events">View Events</PrimaryButton>}
            />
          )}

          <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
            <MetricTile label="Total Devices" value={devices.length} icon="sensors" helper="Registered on network" />
            <MetricTile label="Online" value={onlineCount} tone={onlineCount > 0 ? 'success' : 'danger'} icon="wifi" helper="Active heartbeat window" />
            <MetricTile label="Offline" value={offline.length} tone={offline.length > 0 ? 'danger' : 'neutral'} icon="wifi_off" helper="No recent signal" />
            <MetricTile label="Upload Backlog" value={backlog} tone={backlog > 0 ? 'warning' : 'neutral'} icon="cloud_upload" helper="Pending data transfers" />
          </div>

          <div className="grid min-h-[calc(100vh-320px)] grid-cols-1 gap-lg lg:grid-cols-3">
            <div className={`grid grid-cols-1 gap-gutter lg:col-span-2 ${devices.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {devices.slice(0, 3).map((dev) => (
                <DeviceCameraCard key={dev.device_id} device={dev} />
              ))}

              <Link to="/setup" className={`relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container transition-colors hover:bg-surface-container-high ${devices.length === 1 ? 'min-h-[140px]' : ''}`}>
                <div className="space-y-md text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">add_circle</span>
                  <p className="text-label-xs uppercase tracking-widest text-on-surface-variant">Assign Source</p>
                </div>
              </Link>
            </div>

            <div className="flex min-h-0 flex-col rounded-lg border border-outline-variant/10 bg-surface-container">
              <div className="flex items-center justify-between border-b border-outline-variant/10 p-md">
                <h3 className="text-label-xs font-bold uppercase tracking-widest text-on-surface-variant">Incident Log</h3>
              <span className="rounded-full bg-secondary/20 px-sm py-xs text-[10px] font-bold text-secondary">{criticalCount} ACTIVE</span>
              </div>
              <div className="custom-scrollbar flex-1 space-y-sm overflow-y-auto p-sm">
                {(recentEvents.length ? recentEvents : []).map((event) => (
                  <button
                    key={event.event_id}
                    className={`w-full rounded-lg border p-md text-left transition-all hover:bg-surface-container-high ${event.risk_level === 'high' ? 'border-outline-variant/20 bg-surface-container-high' : 'border-outline-variant/10'}`}
                    onClick={() => navigate(`/events/${event.event_id}`)}
                    type="button"
                  >
                    <div className="mb-xs flex items-start justify-between gap-sm">
                      <span className={`text-label-xs font-bold uppercase ${event.risk_level === 'high' ? 'text-secondary' : 'text-primary'}`}>{event.vehicle_class} violation</span>
                      <span className="shrink-0 text-[10px] text-on-surface-variant">{formatDateTime(event.start_time)}</span>
                    </div>
                    <p className="mb-xs truncate text-body-sm font-bold">{event.device_id}</p>
                    <p className="mb-md text-label-xs text-on-surface-variant">{Math.round(event.duration_seconds)}s stop, confidence {Math.round(event.confidence * 100)}%, {event.review_status.replace('_', ' ')}.</p>
                    <div className="flex gap-xs">
                      <span className="flex-1 rounded bg-primary px-sm py-xs text-center text-[10px] font-bold uppercase text-on-primary">Open Event</span>
                      <span className="rounded bg-surface-container-high px-sm py-xs text-[10px] font-bold uppercase text-on-surface-variant">{event.risk_level ?? 'normal'}</span>
                    </div>
                  </button>
                ))}
                {recentEvents.length === 0 && (
                  <div className="rounded-lg border border-dashed border-outline-variant/20 p-md text-body-sm text-on-surface-variant">No incidents in the current event window.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <SparklinePanel title={topHotspot ? `Traffic Flow: ${topHotspot.roi_id}` : 'Traffic Flow'} bars={trendBars} tone="primary" />
            <SparklinePanel title="Violation Trend: Manual Review" bars={hotspotBars} tone="secondary" />
            <div className="flex flex-col justify-center rounded-lg border border-outline-variant/10 bg-surface-container-low p-md">
              <p className="mb-sm text-label-xs uppercase tracking-widest text-on-surface-variant">Global Status</p>
              <div className="flex items-center gap-md">
                <div className="flex -space-x-2">
                  {(operatorInitials.length ? operatorInitials : ['AE']).map((item, index) => (
                    <div key={`${item}-${index}`} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] ${index === 0 ? 'bg-surface-bright' : index === 1 ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>{item}</div>
                  ))}
                </div>
                <p className="text-label-xs text-on-surface-variant">{operatorsOnDuty} operators on duty, {onlineCount} devices online.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DeviceCameraCard({ device }: { device: DeviceInfo }) {
  return (
    <Link to={`/devices/${device.device_id}`} className="group relative min-h-[220px] overflow-hidden rounded-lg border border-outline-variant/20">
      <div className="absolute inset-0 bg-surface-container-lowest">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(70,69,84,0.10) 2px, rgba(70,69,84,0.10) 4px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(70,69,84,0.06) 24px, rgba(70,69,84,0.06) 25px)',
          }}
        />
        <div className={`pointer-events-none absolute inset-0 ${device.is_online ? 'bg-gradient-to-b from-primary/10 via-transparent to-surface-container-lowest/70' : 'bg-surface-container-lowest/80'}`} />
      </div>

      <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
        {device.is_online ? (
          <>
            <span className="status-dot-critical inline-block" />
            <span className="text-[11px] font-bold tracking-widest text-primary drop-shadow-[0_1px_2px_rgb(0,0,0)]">ONLINE</span>
          </>
        ) : (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-on-surface-variant" />
            <span className="text-[11px] font-bold tracking-widest text-on-surface-variant drop-shadow-[0_1px_2px_rgb(0,0,0)]">OFFLINE</span>
          </>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10">
        <span className="rounded bg-surface-container-lowest/70 px-1.5 py-0.5 font-mono-data text-[10px] text-on-surface-variant shadow-[0_1px_4px_rgba(14,13,21,0.5)]">
          {device.device_id}
        </span>
      </div>

      <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center">
        <div className="rounded-lg bg-surface-container-lowest/50 px-3 py-2 text-center">
          <span className="material-symbols-outlined text-lg text-on-surface-variant">{device.is_online ? 'sensors' : 'wifi_off'}</span>
          <div className="text-label-xs font-semibold text-on-surface">{device.is_online ? 'Heartbeat Active' : 'Signal Lost'}</div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="text-sm font-semibold text-on-surface drop-shadow-[0_1px_3px_rgba(14,13,21,0.9)]">{device.device_name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="font-mono-data text-[11px] text-primary">FPS: {device.fps}</span>
          <span className="font-mono-data text-[11px] text-on-surface-variant">Battery: {device.battery_level}%</span>
          <span className="font-mono-data text-[11px] text-on-surface-variant">Queue: {device.pending_upload_count}</span>
        </div>
      </div>
    </Link>
  );
}

function SparklinePanel({ title, bars, tone }: { title: string; bars: number[]; tone: 'primary' | 'secondary' }) {
  return (
    <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-md">
      <p className="mb-sm truncate text-label-xs uppercase tracking-wider text-on-surface-variant">{title}</p>
      <div className="flex h-16 w-full items-end gap-1">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t-sm ${tone === 'primary' ? 'bg-primary/25' : index === bars.indexOf(Math.max(...bars)) ? 'bg-secondary shadow-[0_0_8px_#ffb5a0]' : 'bg-secondary/20'}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeBars(values: number[]) {
  if (!values.length) return [20, 28, 34, 42, 36, 48, 52, 44];
  const max = Math.max(1, ...values);
  return values.map((value) => Math.max(18, Math.round((value / max) * 92)));
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
