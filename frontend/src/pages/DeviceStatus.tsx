import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Battery, Gauge, Radio, RefreshCw, Thermometer } from 'lucide-react';
import { api } from '../api/client';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import StatusBadge from '../components/StatusBadge';
import type { DeviceInfo } from '../types';
import { formatDateTime } from '../utils/format';

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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="DEVICES"
        title="设备运营中心"
        description="长期使用时，设备在线、上传积压、温度和模型版本比单个事件更早暴露问题。"
        action={<PrimaryButton href="/setup">接入新设备</PrimaryButton>}
      />

      {devices.length > 0 && (
        <div className="mb-5">
          <ActionPanel
            tone={offline.length > 0 || backlog > 0 ? 'warning' : 'success'}
            title={offline.length > 0 ? `${offline.length} 台设备离线` : backlog > 0 ? `${backlog} 条上传积压` : '设备状态正常'}
            description={offline.length > 0 ? '下一步：进入离线设备详情，检查网络、后端地址和前台服务。' : backlog > 0 ? '下一步：查看有积压的设备，等待补传或检查网络。' : '下一步：继续等待事件，或查看最近事件。'}
            action={<PrimaryButton href={offline[0] ? `/devices/${offline[0].device_id}` : backlog > 0 ? '/devices' : '/events'}>处理</PrimaryButton>}
          />
        </div>
      )}

      {error && <StateBlock tone="error" title="设备加载失败" description={error} action={<PrimaryButton icon={RefreshCw} onClick={loadDevices}>重试</PrimaryButton>} />}
      {loading && <StateBlock tone="loading" title="正在加载设备" description="同步心跳、版本和上传积压。" />}
      {!loading && devices.length === 0 && !error && (
        <StateBlock
          title="暂无设备"
          description="下一步：打开接入向导，复制 HP 后端地址到 Android 端完成注册。"
          action={<PrimaryButton href="/setup">打开接入向导</PrimaryButton>}
        />
      )}
      {devices.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {devices.map((dev) => (
            <Link key={dev.device_id} to={`/devices/${dev.device_id}`} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">{dev.device_name}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{dev.device_id}</div>
                </div>
                <StatusBadge status={dev.is_online ? 'online' : 'offline'} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <DeviceMetric icon={Radio} label="最后心跳" value={formatDateTime(dev.last_seen_at)} />
                <DeviceMetric icon={Gauge} label="FPS" value={String(dev.fps)} />
                <DeviceMetric icon={Battery} label="电量" value={`${dev.battery_level}%`} />
                <DeviceMetric icon={Thermometer} label="积压" value={`${dev.pending_upload_count}`} />
              </div>
              <div className="mt-4 text-sm font-semibold text-slate-700">下一步：查看设备详情和最近事件</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <Icon className="h-4 w-4 text-slate-500" />
      <div className="mt-2 text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
