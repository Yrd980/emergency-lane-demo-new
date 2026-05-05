import { useState } from 'react';

export default function ReviewPanel({
  reviewStatus,
  operatorNote,
  onSubmit,
  submitting,
}: {
  reviewStatus: string;
  operatorNote: string;
  onSubmit: (status: string, note: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const [note, setNote] = useState(operatorNote);
  const isReviewed = reviewStatus !== 'pending';

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">人工复核</h3>
      {isReviewed ? (
        <div className="text-sm text-gray-600">
          已复核 ({reviewStatus === 'confirmed' ? '已确认' : '已驳回'}) · {operatorNote || '无备注'}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={3}
            placeholder="复核备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
              onClick={() => onSubmit('confirmed', note)}
            >
              确认占用
            </button>
            <button
              className="px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              disabled={submitting}
              onClick={() => onSubmit('rejected', note)}
            >
              驳回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
