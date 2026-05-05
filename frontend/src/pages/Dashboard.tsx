import { useNavigate } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import type { OverviewStats } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, error } = usePolling<OverviewStats>(() => api.getStats(), 5000);

  if (error) return <div className="text-red-500">加载失败: {error}</div>;
  if (!data) return <div className="text-gray-400">加载中...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">概览</h1>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="今日事件" value={data.total_events_today} />
        <StatCard label="待复核" value={data.pending_review_count} color="bg-yellow-50" />
        <StatCard label="已确认" value={data.confirmed_count} color="bg-green-50" />
        <StatCard label="已驳回" value={data.rejected_count} color="bg-red-50" />
        <StatCard label="在线设备" value={data.online_device_count} color="bg-blue-50" />
      </div>

      <h2 className="text-lg font-semibold mb-2">最近事件</h2>
      <div className="space-y-2">
        {data.recent_events.map((evt) => (
          <div
            key={evt.event_id}
            className="bg-white rounded shadow p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/events/${evt.event_id}`)}
          >
            {evt.thumbnail_url ? (
              <img src={evt.thumbnail_url} alt="" className="w-20 h-14 object-cover rounded" />
            ) : (
              <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">无图</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{evt.event_id}</div>
              <div className="text-xs text-gray-500">
                {evt.start_time} · {evt.duration_seconds}秒 · {evt.vehicle_class}
              </div>
            </div>
            <div className="text-xs text-gray-500">{(evt.confidence * 100).toFixed(0)}%</div>
            <StatusBadge status={evt.review_status} />
          </div>
        ))}
        {data.recent_events.length === 0 && (
          <div className="text-gray-400 text-sm">暂无事件</div>
        )}
      </div>
    </div>
  );
}
