import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import type { DeviceInfo } from '../types';

export default function DeviceStatus() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(() => {
    setLoading(true);
    setError(null);
    api.getDevices()
      .then((d) => { setDevices(d); setError(null); })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void Promise.resolve().then(loadDevices); }, [loadDevices]);

  const offline = devices.filter((d) => !d.is_online);
  const onlineCount = devices.length - offline.length;
  const backlog = devices.reduce((sum, d) => sum + d.pending_upload_count, 0);

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="DEVICES"
        title="Live Camera Feed"
        description="Long-running monitoring: device online status, upload backlog, thermal state, and model version surface issues before individual events do."
        action={<PrimaryButton href="/setup">Add New Device</PrimaryButton>}
      />

      {error && <StateBlock tone="error" title="Device Load Failed" description={error} action={<PrimaryButton icon="refresh" onClick={loadDevices}>Retry</PrimaryButton>} />}
      {loading && <StateBlock tone="loading" title="Loading Devices" description="Syncing heartbeat, version, and upload backlog." />}
      {!loading && devices.length === 0 && !error && (
        <StateBlock title="No Devices" description="Open the setup guide, copy the backend address to the Android device to complete registration." action={<PrimaryButton href="/setup">Open Setup Guide</PrimaryButton>} />
      )}

      {devices.length > 0 && (
        <>
          {/* Action Banner */}
          {offline.length > 0 || backlog > 0 ? (
            <div className="rounded-xl border border-secondary-container/40 bg-secondary-container/10 p-lg">
              <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-on-surface">
                    {offline.length > 0 ? `${offline.length} device(s) offline` : `${backlog} uploads backlogged`}
                  </div>
                  <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">
                    {offline.length > 0 ? 'Next: check offline device details — network, backend address, foreground service.' : 'Next: check devices with backlog, wait for retransmission or check network.'}
                  </div>
                </div>
                <PrimaryButton href={offline[0] ? `/devices/${offline[0].device_id}` : '/devices'}>Investigate</PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-lg">
              <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-on-surface">All Systems Operational</div>
                  <div className="mt-xs max-w-2xl text-body-sm text-on-surface-variant">Next: continue monitoring or review events.</div>
                </div>
                <PrimaryButton href="/events">View Events</PrimaryButton>
              </div>
            </div>
          )}

          {/* 4-Stat Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <MetricTile label="Total Devices" value={devices.length} icon="sensors" helper="Registered on network" />
            <MetricTile label="Online" value={onlineCount} tone={onlineCount > 0 ? 'success' : 'danger'} icon="wifi" helper="Active heartbeat window" />
            <MetricTile label="Offline" value={offline.length} tone={offline.length > 0 ? 'danger' : 'neutral'} icon="wifi_off" helper="No recent signal" />
            <MetricTile label="Upload Backlog" value={backlog} tone={backlog > 0 ? 'warning' : 'neutral'} icon="cloud_upload" helper="Pending data transfers" />
          </div>

          {/* Main: Camera Feed Grid + Incident Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg min-h-[calc(100vh-320px)]">
            {/* Camera Feed Grid — 2/3 width */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-gutter">
              {devices.slice(0, 3).map((dev) => (
                <Link key={dev.device_id} to={`/devices/${dev.device_id}`} className="relative rounded-xl overflow-hidden group border border-outline-variant/20">
                  <div className="absolute inset-0 bg-surface-container-lowest">
                    {/* Scanline pattern */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(70,69,84,0.10) 2px, rgba(70,69,84,0.10) 4px),' +
                          'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(70,69,84,0.06) 24px, rgba(70,69,84,0.06) 25px)',
                      }}
                    />
                    {/* Vignette */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
                  </div>

                  {/* REC / OFFLINE badge */}
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                    {dev.is_online ? (
                      <>
                        <span className="status-dot-critical inline-block" />
                        <span className="text-[11px] font-bold text-error tracking-widest drop-shadow-[0_1px_2px_rgb(0,0,0)]">REC</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block h-2 w-2 rounded-full bg-on-surface-variant" />
                        <span className="text-[11px] font-bold text-on-surface-variant tracking-widest drop-shadow-[0_1px_2px_rgb(0,0,0)]">OFFLINE</span>
                      </>
                    )}
                  </div>

                  {/* Device ID badge */}
                  <div className="absolute right-3 top-3 z-10">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono-data text-[10px] text-on-surface-variant shadow-[0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                      {dev.device_id}
                    </span>
                  </div>

                  {/* Camera name and metrics */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div className="text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {dev.device_name}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {dev.is_online ? (
                        <>
                          <span className="font-mono-data text-[11px] text-primary">
                            FPS: {dev.fps}
                          </span>
                          <span className="font-mono-data text-[11px] text-on-surface-variant">
                            Battery: {dev.battery_level}%
                          </span>
                        </>
                      ) : (
                        <span className="font-mono-data text-[11px] text-on-surface-variant">Signal Lost</span>
                      )}
                    </div>
                  </div>

                  {/* Offline overlay */}
                  {!dev.is_online && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant">wifi_off</span>
                        <span className="text-sm font-semibold text-on-surface-variant">Signal Lost</span>
                      </div>
                    </div>
                  )}
                </Link>
              ))}

              {/* Add Camera Placeholder */}
              <div className="relative rounded-xl overflow-hidden group border border-outline-variant/20 bg-surface-container flex items-center justify-center min-h-[200px]">
                <Link to="/setup" className="text-center space-y-md">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl">add_circle</span>
                  <p className="text-label-xs text-on-surface-variant uppercase tracking-widest">Assign Source</p>
                </Link>
              </div>
            </div>

            {/* Incident Log Sidebar — 1/3 width */}
            <div className="bg-surface-container rounded-xl flex flex-col border border-outline-variant/10 min-h-0">
              <div className="p-md border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-label-xs font-bold uppercase tracking-widest text-on-surface-variant">Incident Log</h3>
                <div className="flex gap-xs">
                  <span className="px-sm py-xs bg-secondary/20 text-secondary text-[10px] font-bold rounded-full">3 CRITICAL</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-sm space-y-sm">
                {[
                  { type: 'LANE VIOLATION', time: '14:22:10', loc: 'M25 North - Sector 4', desc: 'Unauthorized vehicle stopped in emergency lane for >3mins.', critical: true },
                  { type: 'DEBRIS DETECTED', time: '14:18:45', loc: 'A1(M) Southbound', desc: 'Object detected in Lane 1, migrating to Emergency Lane.', critical: false },
                  { type: 'Minor Alert', time: '14:05:22', loc: 'M11 Sector 12', desc: 'Weather alert: Heavy rain impacting visibility.', critical: false },
                ].map((incident, idx) => (
                  <div key={idx} className={`p-md rounded-lg border ${incident.critical ? 'glass-panel border-outline-variant/20 hover:border-primary/50' : 'border-outline-variant/10 hover:bg-surface-container-high'} transition-all ${idx === 2 ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-xs">
                      <span className={`text-label-xs font-bold ${incident.critical ? 'text-secondary' : 'text-primary'}`}>{incident.type}</span>
                      <span className="text-[10px] text-on-surface-variant">{incident.time}</span>
                    </div>
                    <p className="text-body-sm font-bold mb-xs">{incident.loc}</p>
                    <p className="text-label-xs text-on-surface-variant mb-md">{incident.desc}</p>
                    {idx < 2 && (
                      <div className="flex gap-xs">
                        <button className="flex-1 py-xs bg-primary text-on-primary text-[10px] font-bold rounded uppercase">Dispatch</button>
                        <button className="px-sm py-xs bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded uppercase">View</button>
                        <button className="px-sm py-xs hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traffic Sparklines Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-wider">Traffic Flow: M25 North</p>
              <div className="h-16 w-full flex items-end gap-1">
                {[60, 70, 65, 80, 75, 90, 95, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-wider">Violation Trend: Sector 4</p>
              <div className="h-16 w-full flex items-end gap-1">
                {[40, 45, 60, 55, 85, 70, 50, 30].map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${i === 4 ? 'bg-secondary shadow-[0_0_8px_#ffb5a0]' : 'bg-secondary/20'}`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/5 flex flex-col justify-center">
              <p className="text-label-xs text-on-surface-variant mb-sm uppercase tracking-widest">Global Status</p>
              <div className="flex items-center gap-md">
                <div className="flex -space-x-2">
                  {['JD', 'AM', 'SK'].map((initials, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] ${i === 0 ? 'bg-surface-bright' : i === 1 ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>{initials}</div>
                  ))}
                </div>
                <p className="text-label-xs text-on-surface-variant">{onlineCount} Operators on duty</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
