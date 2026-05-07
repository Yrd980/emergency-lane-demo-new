import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Gauge } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { EventListItem } from '../types';
import { formatDateTime, formatPercent } from '../utils/format';

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
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 条事件</span>
        <span>下一步：打开事件详情完成证据复核</span>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-3">证据</th>
              <th className="p-3">事件</th>
              <th className="p-3">设备</th>
              <th className="p-3">停留</th>
              <th className="p-3">置信度</th>
              <th className="p-3">状态</th>
              <th className="p-3 text-right">下一步</th>
            </tr>
          </thead>
          <tbody>
            {items.map((evt) => (
              <tr key={evt.event_id} className="border-b text-sm last:border-b-0 hover:bg-amber-50/40">
                <td className="p-3">
                  {evt.thumbnail_url ? (
                    <img src={evt.thumbnail_url} alt="事件证据缩略图" className="h-14 w-24 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                      待上传
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <button className="text-left" onClick={() => navigate(`/events/${evt.event_id}`)}>
                    <div className="font-mono text-xs font-semibold text-slate-950">{evt.event_id}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(evt.start_time)} · {evt.vehicle_class}</div>
                    {evt.risk_level === 'high' && <div className="mt-2"><StatusBadge status="high" /></div>}
                  </button>
                </td>
                <td className="p-3 text-xs text-slate-600">{evt.device_id}</td>
                <td className="p-3 text-xs text-slate-600">{evt.duration_seconds} 秒</td>
                <td className="p-3 text-xs text-slate-600">{formatPercent(evt.confidence)}</td>
                <td className="p-3"><StatusBadge status={evt.review_status} /></td>
                <td className="p-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    onClick={() => navigate(`/events/${evt.event_id}`)}
                  >
                    查看并复核 <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((evt) => (
          <button
            key={evt.event_id}
            onClick={() => navigate(`/events/${evt.event_id}`)}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm"
          >
            <div className="flex gap-3">
              {evt.thumbnail_url ? (
                <img src={evt.thumbnail_url} alt="事件证据缩略图" className="h-20 w-28 rounded-md object-cover" />
              ) : (
                <div className="flex h-20 w-28 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">待上传</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs font-semibold">{evt.event_id}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" />{formatDateTime(evt.start_time)}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Gauge className="h-3.5 w-3.5" />{formatPercent(evt.confidence)} · {evt.duration_seconds} 秒</div>
                <div className="mt-2"><StatusBadge status={evt.review_status} /></div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={currentPage <= 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            上一页
          </button>
          <span className="text-sm text-slate-500">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => onPage(offset + limit)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
