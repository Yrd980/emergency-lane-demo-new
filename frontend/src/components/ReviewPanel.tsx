import { useState } from 'react';
import { PrimaryButton } from './ProductPrimitives';
import { inputClassName } from './styles';
import { IncidentReviewStateBadge, type IncidentReviewState } from './StatusBadge';

const noteTemplates = [
  '证据清晰，验证为应急车道占用',
  '短暂经过，未形成持续占用',
  '证据不足，无法确认',
  '相机角度异常，需要重新标定 ROI',
  '已记录，无需继续处置',
];

type ReviewOutcome = Exclude<IncidentReviewState, 'pending'>;

export default function ReviewPanel({
  reviewStatus,
  operatorNote,
  onSubmit,
  submitting,
  operatorName,
}: {
  reviewStatus: IncidentReviewState;
  operatorNote: string;
  onSubmit: (status: string, note: string, operatorId?: string) => Promise<boolean>;
  submitting: boolean;
  operatorName: string;
}) {
  const [note, setNote] = useState(operatorNote);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ReviewOutcome | null>(null);
  const isReviewed = reviewStatus !== 'pending';

  async function handleReview(newStatus: ReviewOutcome) {
    if (confirming !== newStatus) {
      setConfirming(newStatus);
      return;
    }
    setSubmitError(null);
    const ok = await onSubmit(newStatus, note, operatorName);
    if (!ok) setSubmitError('复核提交失败，请检查后端后重试');
  }

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-high p-4 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-on-surface">人工复核</h3>
          <p className="mt-1 text-label-xs text-on-surface-variant">下一步：确认或驳回，并留下可追溯备注。</p>
        </div>
        <div className="shrink-0">
          <IncidentReviewStateBadge state={reviewStatus} />
        </div>
      </div>

      {isReviewed ? (
        <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
          <div className="font-semibold">复核已完成</div>
          <div className="mt-2">{operatorNote || '未填写备注'}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {submitError && <div className="rounded-lg border border-error/40 bg-error-container/10 p-3 text-body-sm text-error">{submitError}</div>}
          <div className="grid gap-2">
            {noteTemplates.map((template) => (
              <button
                key={template}
                className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-left text-body-sm leading-5 text-on-surface-variant transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                onClick={() => setNote(template)}
              >
                {template}
              </button>
            ))}
          </div>
          <textarea
            className={inputClassName('min-h-28 w-full p-3')}
            placeholder="填写复核备注，便于后续追溯"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">
            操作员：<span className="font-semibold text-on-surface">{operatorName}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <PrimaryButton
              tone="dark"
              icon={confirming === 'validated' ? 'send' : 'check_circle'}
              disabled={submitting}
              onClick={() => handleReview('validated')}
            >
              {submitting ? '提交中...' : confirming === 'validated' ? '再次点击验证' : '验证疑似事件'}
            </PrimaryButton>
            <PrimaryButton
              tone="light"
              icon={confirming === 'closed' ? 'send' : 'archive'}
              disabled={submitting}
              onClick={() => handleReview('closed')}
            >
              {submitting ? '提交中...' : confirming === 'closed' ? '再次点击关闭' : '关闭记录'}
            </PrimaryButton>
            <PrimaryButton
              tone="danger"
              icon={confirming === 'false_alarm' ? 'send' : 'cancel'}
              disabled={submitting}
              onClick={() => handleReview('false_alarm')}
            >
              {submitting ? '提交中...' : confirming === 'false_alarm' ? '再次点击标记误报' : '标记误报'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
