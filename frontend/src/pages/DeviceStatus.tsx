import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
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

  useEffect(() => { loadDevices(); }, [loadDevices]);

  if (loading) return <div className="text-gray-400">加载中...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">设备状态</h1>
      {error && <ErrorBanner message={`加载设备失败: ${error}`} onRetry={loadDevices} />}
      {!loading && devices.length === 0 && !error && (
        <EmptyState
          icon="📱"
          title="暂无设备"
          description="还没有设备注册到系统"
        />
      )}
      {devices.length > 0 && (
        <div className="grid gap-4">
          {devices.map((dev) => (
            <div key={dev.device_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">{dev.device_name}</div>
                <span
                  className={`inline-block w-2 h-2 rounded-full ${dev.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">设备 ID:</span> {dev.device_id}</div>
                <div><span className="text-gray-500">App 版本:</span> {dev.app_version}</div>
                <div><span className="text-gray-500">模型版本:</span> {dev.model_version}</div>
                <div><span className="text-gray-500">最后心跳:</span> {dev.last_seen_at}</div>
                <div><span className="text-gray-500">FPS:</span> {dev.fps}</div>
                <div><span className="text-gray-500">电量:</span> {dev.battery_level}%</div>
                <div><span className="text-gray-500">温度:</span> {dev.thermal_state}</div>
                <div><span className="text-gray-500">待上传:</span> {dev.pending_upload_count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
