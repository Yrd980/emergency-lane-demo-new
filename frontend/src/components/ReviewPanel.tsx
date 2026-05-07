import { useState } from 'react';
import { CheckCircle2, Send, XCircle } from 'lucide-react';
import { PrimaryButton } from './ProductPrimitives';
import StatusBadge from './StatusBadge';

const noteTemplates = [
  '证据清晰，疑似占用成立',
  '短暂经过，未形成持续占用',
  '证据不足，暂不确认',
  '设备角度异常，需要重新标定 ROI',
];

export default function ReviewPanel({
  reviewStatus,
  operatorNote,
  onSubmit,
  submitting,
}: {
  reviewStatus: string;
  operatorNote: string;
  onSubmit: (status: string, note: string, operatorId: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const [note, setNote] = useState(operatorNote);
  const [operatorId, setOperatorId] = useState('本地复核员');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'confirmed' | 'rejected' | null>(null);
  const isReviewed = reviewStatus !== 'pending';

  async function handleReview(newStatus: 'confirmed' | 'rejected') {
    if (confirming !== newStatus) {
      setConfirming(newStatus);
      return;
    }
    setSubmitError(null);
    const ok = await onSubmit(newStatus, note, operatorId);
    if (!ok) setSubmitError('复核提交失败，请检查本地后端后重试');
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">人工复核</h3>
          <p className="mt-1 text-xs text-slate-500">下一步：给出确认或驳回，并留下可追溯备注。</p>
        </div>
        <StatusBadge status={reviewStatus} />
      </div>

      {isReviewed ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold">已完成复核</div>
          <div className="mt-2">{operatorNote || '未填写备注'}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {submitError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
          <div className="flex flex-wrap gap-2">
            {noteTemplates.map((template) => (
              <button
                key={template}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={() => setNote(template)}
              >
                {template}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-28 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            placeholder="填写复核备注，方便后续追溯"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="block text-xs font-medium text-slate-600">
            操作者
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="例如：reviewer_a"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton
              tone="dark"
              icon={confirming === 'confirmed' ? Send : CheckCircle2}
              disabled={submitting}
              onClick={() => handleReview('confirmed')}
            >
              {submitting ? '正在提交...' : confirming === 'confirmed' ? '再次点击确认占用' : '确认占用'}
            </PrimaryButton>
            <PrimaryButton
              tone="danger"
              icon={confirming === 'rejected' ? Send : XCircle}
              disabled={submitting}
              onClick={() => handleReview('rejected')}
            >
              {submitting ? '正在提交...' : confirming === 'rejected' ? '再次点击驳回' : '驳回事件'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
