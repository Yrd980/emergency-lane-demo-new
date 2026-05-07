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
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: {
  items: EventListItem[];
  total: number;
  offset: number;
  limit: number;
  onPage: (offset: number) => void;
  selectedIds?: string[];
  onToggleSelect?: (eventId: string) => void;
  onToggleSelectAll?: () => void;
}) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const selectableItems = items.filter((evt) => evt.review_status === 'pending');
  const selectedSet = new Set(selectedIds);
  const allSelected = selectableItems.length > 0 && selectableItems.every((evt) => selectedSet.has(evt.event_id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
        <span>共 {total} 条事件</span>
        <span className="hidden sm:inline">高优先级置顶，下一步：选择事件或打开详情复核</span>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] shadow-[0_1px_0_rgba(32,32,29,0.04)] lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-soft)] text-left text-xs font-medium text-[var(--muted)]">
              {onToggleSelect && (
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--brand)] focus:ring-[var(--brand)]"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="选择当前页待复核事件"
                  />
                </th>
              )}
              <th className="p-3">证据</th>
              <th className="p-3">优先级</th>
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
              <tr key={evt.event_id} className="border-b border-[var(--line)] text-sm last:border-b-0 hover:bg-[var(--brand-soft)]/10">
                {onToggleSelect && (
                  <td className="p-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      checked={selectedSet.has(evt.event_id)}
                      disabled={evt.review_status !== 'pending'}
                      onChange={() => onToggleSelect(evt.event_id)}
                      aria-label={`选择事件 ${evt.event_id}`}
                    />
                  </td>
                )}
                <td className="p-3">
                  {evt.thumbnail_url ? (
                    <img src={evt.thumbnail_url} alt="事件证据缩略图" className="h-14 w-24 rounded-lg object-cover ring-1 ring-[var(--line)]" />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-xs text-[var(--faint)]">
                      待上传
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    <StatusBadge status={evt.risk_level ?? 'normal'} />
                    <div className="max-w-28 text-xs leading-5 text-[var(--muted)]">{evt.review_priority_reason ?? '按时间顺序处理'}</div>
                  </div>
                </td>
                <td className="p-3">
                  <button className="text-left" onClick={() => navigate(`/events/${evt.event_id}`)}>
                    <div className="font-mono text-xs font-semibold text-[var(--text)]">{evt.event_id}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatDateTime(evt.start_time)} · {evt.vehicle_class}</div>
                  </button>
                </td>
                <td className="p-3 text-xs text-[var(--muted)]">{evt.device_id}</td>
                <td className="p-3 text-xs text-[var(--muted)]">{evt.duration_seconds} 秒</td>
                <td className="p-3 text-xs text-[var(--muted)]">{formatPercent(evt.confidence)}</td>
                <td className="p-3"><StatusBadge status={evt.review_status} /></td>
                <td className="p-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-soft)]"
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
          <div key={evt.event_id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 shadow-[0_1px_0_rgba(32,32,29,0.04)] transition hover:border-[var(--brand)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--brand)] focus:ring-[var(--brand)]"
                    checked={selectedSet.has(evt.event_id)}
                    disabled={evt.review_status !== 'pending'}
                    onChange={() => onToggleSelect(evt.event_id)}
                    aria-label={`选择事件 ${evt.event_id}`}
                  />
                )}
                <StatusBadge status={evt.risk_level ?? 'normal'} />
              </div>
              <StatusBadge status={evt.review_status} />
            </div>
            <button onClick={() => navigate(`/events/${evt.event_id}`)} className="w-full text-left">
            <div className="flex gap-3">
              {evt.thumbnail_url ? (
                <img src={evt.thumbnail_url} alt="事件证据缩略图" className="h-20 w-28 rounded-lg object-cover ring-1 ring-[var(--line)]" />
              ) : (
                <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-xs text-[var(--faint)]">待上传</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs font-semibold">{evt.event_id}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]"><Clock className="h-3.5 w-3.5" />{formatDateTime(evt.start_time)}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]"><Gauge className="h-3.5 w-3.5" />{formatPercent(evt.confidence)} · {evt.duration_seconds} 秒</div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{evt.review_priority_reason ?? '按时间顺序处理'}</div>
              </div>
            </div>
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={currentPage <= 1}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            上一页
          </button>
          <span className="text-sm text-[var(--muted)]">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => onPage(offset + limit)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
