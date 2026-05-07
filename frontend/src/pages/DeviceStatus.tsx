import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Battery, Clock, Gauge, HardDrive, List, WifiOff } from 'lucide-react';
import { api } from '../api/client';
import { ActionPanel, MetricTile, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceInfo } from '../types';
import { formatDateTime } from '../utils/format';

const INCIDENT_TYPES = [
  { type: 'Speeding', count: 12 },
  { type: 'Lane Departure', count: 8 },
  { type: 'Red Light Violation', count: 5 },
  { type: 'Illegal U-Turn', count: 3 },
] as const;

const RECENT_ACTIVITY = [
  { time: '14:23', event: 'EVT-4031', desc: 'Speeding — 85 km/h in 60 zone' },
  { time: '13:57', event: 'EVT-4030', desc: 'Lane departure — Vehicle ALB-429' },
  { time: '13:12', event: 'EVT-4029', desc: 'Red light — Intersection NW-7' },
  { time: '12:45', event: 'EVT-4028', desc: 'Illegal U-turn — Main & 3rd' },
] as const;

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

  const offline = devices.filter((device) => !device.is_online);
  const backlog = devices.reduce((sum, device) => sum + device.pending_upload_count, 0);
  const onlineCount = devices.length - offline.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DEVICES"
        title="设备运营中心"
        description="长期使用时，设备在线、上传积压、温度和模型版本比单个事件更早暴露问题。"
        action={<PrimaryButton href="/setup">接入新设备</PrimaryButton>}
      />

      {devices.length > 0 && (
        <ActionPanel
          tone={offline.length > 0 || backlog > 0 ? 'warning' : 'success'}
          title={offline.length > 0 ? `${offline.length} 台设备离线` : backlog > 0 ? `${backlog} 条上传积压` : '设备状态正常'}
          description={offline.length > 0 ? '下一步：进入离线设备详情，检查网络、后端地址和前台服务。' : backlog > 0 ? '下一步：查看有积压的设备，等待补传或检查网络。' : '下一步：继续等待事件，或查看最近事件。'}
          action={<PrimaryButton href={offline[0] ? `/devices/${offline[0].device_id}` : backlog > 0 ? '/devices' : '/events'}>处理</PrimaryButton>}
        />
      )}

      {error && <StateBlock tone="error" title="设备加载失败" description={error} action={<PrimaryButton icon="refresh" onClick={loadDevices}>重试</PrimaryButton>} />}
      {loading && <StateBlock tone="loading" title="正在加载设备" description="同步心跳、版本和上传积压。" />}
      {!loading && devices.length === 0 && !error && (
        <StateBlock
          title="暂无设备"
          description="下一步：打开接入向导，复制 HP 后端地址到 Android 端完成注册。"
          action={<PrimaryButton href="/setup">打开接入向导</PrimaryButton>}
        />
      )}

      {devices.length > 0 && (
        <>
          {/* 4-Stat Bento Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total Devices" value={devices.length} helper="Registered on network" />
            <MetricTile
              label="Online"
              value={onlineCount}
              tone={onlineCount > 0 ? 'success' : 'danger'}
              helper="Active heartbeat window"
            />
            <MetricTile
              label="Offline"
              value={offline.length}
              tone={offline.length > 0 ? 'danger' : 'neutral'}
              helper="No recent signal"
            />
            <MetricTile
              label="Upload Backlog"
              value={backlog}
              tone={backlog > 0 && offline.length === 0 ? 'warning' : backlog > 0 ? 'danger' : 'neutral'}
              helper="Pending data transfers"
            />
          </section>

          {/* Main: Camera Feeds + Incident Log */}
          <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            {/* Camera Feed Cards */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-[var(--text)]">Camera Feeds</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Live device monitoring panel</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--line)]/10 bg-[var(--surface)] px-3 py-1.5">
                  <span
                    className={
                      onlineCount > 0
                        ? 'status-dot-healthy inline-block'
                        : 'status-dot-critical inline-block'
                    }
                  />
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {onlineCount}/{devices.length}
                  </span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {devices.map((dev) => (
                  <CameraFeedCard key={dev.device_id} device={dev} />
                ))}
              </div>
            </div>

            {/* Incident Log Sidebar */}
            <IncidentLog />
          </section>
        </>
      )}
    </div>
  );
}

function CameraFeedCard({ device }: { device: DeviceInfo }) {
  return (
    <Link
      to={`/devices/${device.device_id}`}
      className="group relative overflow-hidden rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)] transition-all hover:border-[var(--brand)]/30 active:scale-[0.98]"
    >
      {/* Camera Feed Area */}
      <div className="relative aspect-video overflow-hidden bg-[var(--canvas)]">
        {/* Scanline + crosshatch pattern */}
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

        {/* Status indicator / REC dot */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {device.is_online ? (
            <>
              <span className="status-dot-critical inline-block" />
              <span className="text-[11px] font-bold text-[var(--danger)] tracking-widest drop-shadow-[0_1px_2px_rgb(0,0,0)]">
                REC
              </span>
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--muted)]" />
              <span className="text-[11px] font-bold text-[var(--muted)] tracking-widest drop-shadow-[0_1px_2px_rgb(0,0,0)]">
                OFFLINE
              </span>
            </>
          )}
        </div>

        {/* Device ID badge */}
        <div className="absolute right-3 top-3 z-10">
          <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-[var(--faint)] shadow-[0_1px_4px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            {device.device_id}
          </span>
        </div>

        {/* Camera name */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {device.device_name}
          </div>
        </div>

        {/* Offline overlay */}
        {!device.is_online && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-2">
              <WifiOff className="h-8 w-8 text-[var(--muted)]" />
              <span className="text-sm font-semibold text-[var(--muted)]">Signal Lost</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="border-t border-[var(--line)]/10 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={device.is_online ? 'online' : 'offline'} />
            {device.is_online && (
              <>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted)]">
                  <Gauge className="h-3 w-3" />
                  {device.fps}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted)]">
                  <Battery className="h-3 w-3" />
                  {device.battery_level}%
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {device.pending_upload_count > 0 && (
              <span className="flex items-center gap-1 font-mono text-[var(--warning)]">
                <HardDrive className="h-3 w-3" />
                {device.pending_upload_count}
              </span>
            )}
            <span className="font-mono text-[10px] text-[var(--faint)]">
              {formatDateTime(device.last_seen_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function IncidentLog() {
  const totalIncidents = INCIDENT_TYPES.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="rounded-xl border border-[var(--line)]/10 bg-[var(--surface-soft)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--text)]">Incident Log</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Recent violation breakdown</p>
        </div>
        <List className="h-5 w-5 text-[var(--muted)]" />
      </div>

      {/* By Type */}
      <div className="mt-5 space-y-2">
        <div className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
          By Type
        </div>
        {INCIDENT_TYPES.map((item) => (
          <div
            key={item.type}
            className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2.5 transition hover:bg-[var(--surface-raised)]"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />
              <span className="text-sm text-[var(--text)]">{item.type}</span>
            </div>
            <span className="font-mono text-sm font-semibold text-[var(--brand)]">{item.count}</span>
          </div>
        ))}
      </div>

      <div className="my-5 border-t border-[var(--line)]/10" />

      {/* Recent Activity */}
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
          Recent
        </div>
        {RECENT_ACTIVITY.map((item) => (
          <div
            key={item.event}
            className="flex items-center gap-3 rounded-lg bg-[var(--surface)] px-3 py-2.5 transition hover:bg-[var(--surface-raised)]"
          >
            <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-[var(--text)]">{item.desc}</div>
              <div className="font-mono text-[11px] text-[var(--faint)]">{item.event}</div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-[var(--faint)]">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="my-5 border-t border-[var(--line)]/10" />

      {/* Total */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--line)]/10 bg-[var(--surface)] px-3 py-2.5">
        <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
          Today Total
        </span>
        <span className="font-mono text-lg font-semibold text-[var(--brand)]">{totalIncidents}</span>
      </div>
    </div>
  );
}
