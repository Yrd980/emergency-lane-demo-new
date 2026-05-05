import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import type { EventListItem } from '../types';

export default function EventTable({
  items,
  total,
  offset,
  limit,
  onPage,
}: {
  items: EventListItem[];
  total: number;
  offset: number;
  limit: number;
  onPage: (offset: number) => void;
}) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">共 {total} 条</div>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b">
            <th className="p-2">缩略图</th>
            <th className="p-2">事件 ID</th>
            <th className="p-2">时间</th>
            <th className="p-2">设备</th>
            <th className="p-2">时长</th>
            <th className="p-2">类别</th>
            <th className="p-2">置信度</th>
            <th className="p-2">状态</th>
          </tr>
        </thead>
        <tbody>
          {items.map((evt) => (
            <tr
              key={evt.event_id}
              className="border-b hover:bg-gray-50 cursor-pointer text-sm"
              onClick={() => navigate(`/events/${evt.event_id}`)}
            >
              <td className="p-2">
                {evt.thumbnail_url ? (
                  <img src={evt.thumbnail_url} alt="" className="w-16 h-10 object-cover rounded" />
                ) : (
                  <div className="w-16 h-10 bg-gray-200 rounded" />
                )}
              </td>
              <td className="p-2 font-mono text-xs">{evt.event_id}</td>
              <td className="p-2 text-xs">{evt.start_time}</td>
              <td className="p-2 text-xs">{evt.device_id}</td>
              <td className="p-2 text-xs">{evt.duration_seconds}秒</td>
              <td className="p-2 text-xs">{evt.vehicle_class}</td>
              <td className="p-2 text-xs">{(evt.confidence * 100).toFixed(0)}%</td>
              <td className="p-2"><StatusBadge status={evt.review_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          <button
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            上一页
          </button>
          <span className="text-sm py-1 text-gray-500">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
            onClick={() => onPage(offset + limit)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
