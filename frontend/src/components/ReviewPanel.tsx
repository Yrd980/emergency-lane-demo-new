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
}: {
  reviewStatus: string;
  operatorNote: string;
  onSubmit: (status: string, note: string, operatorId: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const [note, setNote] = useState(operatorNote);
  const [operatorId, setOperatorId] = useState('Local Reviewer');
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
          <label className="block text-label-xs font-medium text-on-surface-variant">
            Operator
            <input
              className={inputClassName('mt-2 w-full font-normal')}
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="e.g. reviewer_a"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <PrimaryButton
              tone="dark"
              icon={confirming === 'confirmed' ? 'send' : 'check_circle'}
              disabled={submitting}
              onClick={() => handleReview('confirmed')}
            >
              {submitting ? 'Submitting...' : confirming === 'confirmed' ? 'Click Again to Confirm' : 'Confirm Violation'}
            </PrimaryButton>
            <PrimaryButton
              tone="danger"
              icon={confirming === 'rejected' ? 'send' : 'cancel'}
              disabled={submitting}
              onClick={() => handleReview('rejected')}
            >
              {submitting ? 'Submitting...' : confirming === 'rejected' ? 'Click Again to Reject' : 'Reject Event'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
