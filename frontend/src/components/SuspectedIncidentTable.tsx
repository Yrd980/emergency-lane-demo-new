import { useNavigate } from 'react-router-dom';
import { IncidentReviewStateBadge, ReviewPriorityBadge } from './StatusBadge';
import type { SuspectedIncidentListItem } from '../types';
import { formatDateTime, formatPercent } from '../utils/format';

export default function SuspectedIncidentTable({
  items,
  total,
  offset,
  limit,
  onPage,
  mode = 'log',
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: {
  items: SuspectedIncidentListItem[];
  total: number;
  offset: number;
  limit: number;
  onPage: (offset: number) => void;
  mode?: 'review' | 'log';
  selectedIds?: string[];
  onToggleSelect?: (eventId: string) => void;
  onToggleSelectAll?: () => void;
}) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const detailHref = (eventId: string) => `/suspected-incidents/${eventId}?from=${mode}`;
  const selectableItems = items.filter((evt) => evt.review_status === 'pending');
  const selectedSet = new Set(selectedIds);
  const allSelected = selectableItems.length > 0 && selectableItems.every((evt) => selectedSet.has(evt.suspected_incident_id));
  const reviewPriority = (evt: SuspectedIncidentListItem) => evt.review_priority ?? 'normal';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-body-sm text-on-surface-variant">
        <span>共 {total} 条疑似疑似事件</span>
        <span className="hidden sm:inline">
          {mode === 'review' ? '高优先级置顶，下一步：选择疑似疑似事件或打开详情复核' : '按时间追溯，下一步：打开详情查看证据和处理记录'}
        </span>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-high shadow-[0_1px_0_rgba(32,32,29,0.04)] lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low text-left text-label-xs font-medium uppercase tracking-wider text-on-surface-variant">
              {onToggleSelect && (
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="选择当前页待复核疑似事件"
                  />
                </th>
              )}
              <th className="p-3">证据</th>
              <th className="p-3">优先级</th>
              <th className="p-3">疑似疑似事件</th>
              <th className="p-3">设备</th>
              <th className="p-3">停留</th>
              <th className="p-3">置信度</th>
              <th className="p-3">状态</th>
              <th className="p-3 text-right">下一步</th>
            </tr>
          </thead>
          <tbody>
            {items.map((evt) => (
              <tr key={evt.suspected_incident_id} className="border-b border-outline-variant/25 text-body-sm last:border-b-0 hover:bg-primary/5">
                {onToggleSelect && (
                  <td className="p-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                      checked={selectedSet.has(evt.suspected_incident_id)}
                      disabled={evt.review_status !== 'pending'}
                      onChange={() => onToggleSelect(evt.suspected_incident_id)}
                      aria-label={`选择疑似疑似事件 ${evt.suspected_incident_id}`}
                    />
                  </td>
                )}
                <td className="p-3">
                  {evt.thumbnail_url ? (
                    <img src={evt.thumbnail_url} alt="疑似疑似事件证据缩略图" className="h-14 w-24 rounded-lg object-cover ring-1 ring-outline-variant" />
                  ) : (
                    <div className="flex h-14 w-24 items-center justify-center rounded-lg bg-surface-container-low text-label-xs text-on-surface-variant">
                      待上传
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="space-y-1">
                    <ReviewPriorityBadge priority={reviewPriority(evt)} />
                    <div className="max-w-28 text-label-xs leading-5 text-on-surface-variant">{evt.review_priority_reason ?? '按时间顺序处理'}</div>
                  </div>
                </td>
                <td className="p-3">
                  <button className="rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => navigate(detailHref(evt.suspected_incident_id))}>
                    <div className="font-mono-data text-label-xs font-semibold text-on-surface">{evt.suspected_incident_id}</div>
                    <div className="mt-1 text-label-xs text-on-surface-variant">{formatDateTime(evt.start_time)} · {evt.vehicle_class}</div>
                  </button>
                </td>
                <td className="p-3 text-label-xs text-on-surface-variant">{evt.device_id}</td>
                <td className="p-3 text-label-xs text-on-surface-variant">{evt.duration_seconds} 秒</td>
                <td className="p-3 text-label-xs text-on-surface-variant">{formatPercent(evt.confidence)}</td>
                <td className="p-3"><IncidentReviewStateBadge state={evt.review_status} /></td>
                <td className="p-3 text-right">
                  <button
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-label-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={() => navigate(detailHref(evt.suspected_incident_id))}
                  >
                    {mode === 'review' ? '查看并复核' : '查看详情'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((evt) => (
          <div key={evt.suspected_incident_id} className="rounded-lg border border-outline-variant/40 bg-surface-container-high p-3 shadow-[0_1px_0_rgba(32,32,29,0.04)] transition hover:border-primary">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                    checked={selectedSet.has(evt.suspected_incident_id)}
                    disabled={evt.review_status !== 'pending'}
                    onChange={() => onToggleSelect(evt.suspected_incident_id)}
                    aria-label={`选择疑似疑似事件 ${evt.suspected_incident_id}`}
                  />
                )}
                <ReviewPriorityBadge priority={reviewPriority(evt)} />
              </div>
              <IncidentReviewStateBadge state={evt.review_status} />
            </div>
            <button onClick={() => navigate(detailHref(evt.suspected_incident_id))} className="w-full rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex gap-3">
              {evt.thumbnail_url ? (
                <img src={evt.thumbnail_url} alt="疑似疑似事件证据缩略图" className="h-20 w-28 rounded-lg object-cover ring-1 ring-outline-variant" />
              ) : (
                <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-surface-container-low text-label-xs text-on-surface-variant">待上传</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono-data text-label-xs font-semibold">{evt.suspected_incident_id}</div>
                <div className="mt-2 flex items-center gap-2 text-label-xs text-on-surface-variant"><span className="material-symbols-outlined text-sm">schedule</span>{formatDateTime(evt.start_time)}</div>
                <div className="mt-1 flex items-center gap-2 text-label-xs text-on-surface-variant"><span className="material-symbols-outlined text-sm">speed</span>{formatPercent(evt.confidence)} · {evt.duration_seconds} 秒</div>
                <div className="mt-2 text-label-xs leading-5 text-on-surface-variant">{evt.review_priority_reason ?? '按时间顺序处理'}</div>
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
            className="min-h-11 rounded-lg border border-outline-variant/50 bg-surface-container-high px-4 py-2 text-body-sm font-semibold disabled:opacity-50"
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            上一页
          </button>
          <span className="text-body-sm text-on-surface-variant">{currentPage} / {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            className="min-h-11 rounded-lg border border-outline-variant/50 bg-surface-container-high px-4 py-2 text-body-sm font-semibold disabled:opacity-50"
            onClick={() => onPage(offset + limit)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
