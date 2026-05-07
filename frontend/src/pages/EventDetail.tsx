import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, History, RefreshCw } from 'lucide-react';
import { useEventDetail } from '../hooks/useEventDetail';
import { useReview } from '../hooks/useReview';
import StatusBadge from '../components/StatusBadge';
import EvidenceViewer from '../components/EvidenceViewer';
import ReviewPanel from '../components/ReviewPanel';
import { ActionPanel, PageHeader, PrimaryButton, StateBlock } from '../components/ProductPrimitives';
import { useToast } from '../hooks/useToast';
import type { ReviewHistoryItem } from '../types';
import { formatFullDateTime, formatPercent } from '../utils/format';

function formatGpsLocation(gps: unknown): string {
  if (!gps || typeof gps !== 'object') return '无';
  const location = gps as { lat?: unknown; lng?: unknown };
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return '无';
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useEventDetail(id!);
  const { submit, submitting } = useReview(id!);

  if (loading) return <StateBlock tone="loading" title="正在加载事件详情" description="同步证据、结构化字段和复核状态。" />;
  if (error) {
    return (
      <StateBlock
        tone="error"
        title={error.includes('不存在') ? '事件不存在' : '事件详情加载失败'}
        description={error}
        action={<PrimaryButton icon={error.includes('不存在') ? ArrowLeft : RefreshCw} onClick={() => (error.includes('不存在') ? navigate('/events') : refetch())}>{error.includes('不存在') ? '返回事件列表' : '重试'}</PrimaryButton>}
      />
    );
  }
  if (!data) return null;

  const handleReview = async (status: string, note: string, operatorId: string): Promise<boolean> => {
    const ok = await submit(status, note, operatorId);
    if (ok) {
      showToast(status === 'confirmed' ? '已确认占用，复核结果已保存' : '已驳回事件，复核结果已保存', 'success');
      refetch();
    }
    return ok;
  };

  return (
    <div>
      <PageHeader
        eyebrow="EVIDENCE REVIEW"
        title="事件复核"
        description="先看证据链，再核对结构化字段，最后完成复核。"
        action={
          <>
            <PrimaryButton tone="light" icon={ArrowLeft} onClick={() => navigate('/review')}>返回队列</PrimaryButton>
            {data.next_event_id && <PrimaryButton icon={ArrowRight} href={`/events/${data.next_event_id}`}>下一条</PrimaryButton>}
          </>
        }
      />

      <div className="mb-5">
        <ActionPanel
          tone={data.review_status === 'pending' ? 'warning' : 'success'}
          title={data.review_status === 'pending' ? '下一步：完成此事件复核' : '此事件已复核'}
          description={data.review_status === 'pending' ? data.review_priority_reason ?? '请根据证据链作出确认或驳回。' : '可以继续查看下一条，或返回复核队列。'}
          action={data.review_status === 'pending' ? <StatusBadge status={data.risk_level ?? 'normal'} /> : <PrimaryButton href="/review">回到复核队列</PrimaryButton>}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <EvidenceViewer files={data.evidence_files} summary={data.evidence_summary} />
        </section>
        <aside className="space-y-4">
          <ReviewPanel
            reviewStatus={data.review_status}
            operatorNote={data.operator_note}
            onSubmit={handleReview}
            submitting={submitting}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">事件字段</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Field label="事件 ID" value={data.event_id} mono />
              <Field label="设备" value={data.device_id} />
              <Field label="开始时间" value={formatFullDateTime(data.start_time)} />
              <Field label="结束时间" value={formatFullDateTime(data.end_time)} />
              <Field label="持续时长" value={`${data.duration_seconds} 秒`} />
              <Field label="轨迹 ID" value={data.track_id} />
              <Field label="车辆类别" value={data.vehicle_class} />
              <Field label="置信度" value={formatPercent(data.confidence)} />
              <Field label="GPS" value={formatGpsLocation(data.gps_location)} />
              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-500">状态</span>
                <StatusBadge status={data.review_status} />
              </div>
            </div>
          </div>
          <ReviewHistory history={data.review_history} />
        </aside>
      </div>
    </div>
  );
}

function ReviewHistory({ history }: { history: ReviewHistoryItem[] }) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-slate-950">
          <History className="h-4 w-4" />
          复核历史
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">尚无复核记录。下一步：完成确认或驳回后，这里会记录操作者和改判轨迹。</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-950">
        <History className="h-4 w-4" />
        复核历史
      </div>
      <div className="mt-4 space-y-3">
        {history.map((item) => (
          <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-900">{item.operator_id}</span>
              <span className="text-xs text-slate-500">{formatFullDateTime(item.reviewed_at)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={item.from_status} />
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <StatusBadge status={item.to_status} />
            </div>
            <p className="mt-2 leading-6 text-slate-600">{item.operator_note || '未填写备注'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
