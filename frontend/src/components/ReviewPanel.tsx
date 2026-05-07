import { useState } from 'react';
import { PrimaryButton } from './ProductPrimitives';
import { inputClassName } from './styles';
import StatusBadge from './StatusBadge';

const noteTemplates = [
  'Evidence clear, violation confirmed',
  'Brief pass-through, no sustained occupation',
  'Insufficient evidence, cannot confirm',
  'Camera angle abnormal, ROI recalibration needed',
];

export default function ReviewPanel({
  reviewStatus,
  operatorNote,
  onSubmit,
  submitting,
  operatorName,
}: {
  reviewStatus: string;
  operatorNote: string;
  onSubmit: (status: string, note: string, operatorId?: string) => Promise<boolean>;
  submitting: boolean;
  operatorName: string;
}) {
  const [note, setNote] = useState(operatorNote);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'validated' | 'false_alarm' | null>(null);
  const isReviewed = reviewStatus !== 'pending';

  async function handleReview(newStatus: 'validated' | 'false_alarm') {
    if (confirming !== newStatus) {
      setConfirming(newStatus);
      return;
    }
    setSubmitError(null);
    const ok = await onSubmit(newStatus, note, operatorName);
    if (!ok) setSubmitError('Review submission failed, check backend and retry');
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-on-surface">Manual Review</h3>
          <p className="mt-1 text-label-xs text-on-surface-variant">Next: confirm or reject, and leave a traceable note.</p>
        </div>
        <StatusBadge status={reviewStatus} />
      </div>

      {isReviewed ? (
        <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
          <div className="font-semibold">Review Completed</div>
          <div className="mt-2">{operatorNote || 'No note provided'}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {submitError && <div className="rounded-lg border border-error/40 bg-error-container/10 p-3 text-body-sm text-error">{submitError}</div>}
          <div className="flex flex-wrap gap-2">
            {noteTemplates.map((template) => (
              <button
                key={template}
                className="rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-label-xs text-on-surface-variant hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-all"
                onClick={() => setNote(template)}
              >
                {template}
              </button>
            ))}
          </div>
          <textarea
            className={inputClassName('min-h-28 w-full p-3')}
            placeholder="Fill in review notes for traceability"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-3 text-body-sm text-on-surface-variant">
            Operator: <span className="font-semibold text-on-surface">{operatorName}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton
              tone="dark"
              icon={confirming === 'validated' ? 'send' : 'check_circle'}
              disabled={submitting}
              onClick={() => handleReview('validated')}
            >
              {submitting ? 'Submitting...' : confirming === 'validated' ? 'Click Again to Validate' : 'Validate Violation'}
            </PrimaryButton>
            <PrimaryButton
              tone="danger"
              icon={confirming === 'false_alarm' ? 'send' : 'cancel'}
              disabled={submitting}
              onClick={() => handleReview('false_alarm')}
            >
              {submitting ? 'Submitting...' : confirming === 'false_alarm' ? 'Click Again to Mark False Alarm' : 'False Alarm'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
