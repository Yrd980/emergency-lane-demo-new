import { useMemo, useState } from 'react';
import type { EvidenceFile, EvidenceSummary } from '../types';
import { cn } from '../utils/format';

const labels: Record<string, string> = {
  frame_before: '进入前',
  frame_peak: '峰值帧',
  frame_after: '离开后',
  video_clip: '视频片段',
};

export default function EvidenceViewer({
  files,
  summary,
}: {
  files: EvidenceFile[];
  summary?: EvidenceSummary;
}) {
  const media = useMemo(() => files.filter((f) => f.mime_type.startsWith('image/') || f.mime_type.startsWith('video/')), [files]);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = media[activeIdx];

  if (media.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline bg-surface-container-high p-8 text-center">
        <span className="material-symbols-outlined text-2xl text-on-surface-variant mx-auto">hide_image</span>
        <div className="mt-3 font-semibold text-on-surface">Evidence not yet uploaded</div>
        <p className="mt-2 text-body-sm text-on-surface-variant">Next: check Android queue and device network, wait for retransmission then refresh the event.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="overflow-hidden rounded-xl border border-[#2c2c35] bg-background shadow-[0_18px_46px_rgba(32,32,29,0.12)]">
        <div className="flex min-h-[300px] items-center justify-center sm:min-h-[480px]">
          {active?.mime_type.startsWith('image/') ? (
            <img src={active.url} alt={labels[active.evidence_type] ?? active.evidence_type} className="max-h-[68vh] max-w-full object-contain" />
          ) : (
            <video controls className="max-h-[68vh] max-w-full" src={active?.url} />
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
          <div className="text-body-sm font-semibold text-on-surface">Evidence Chain Integrity</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-label-xs">
            <EvidenceMark label="进入前" ok={summary?.has_before ?? false} />
            <EvidenceMark label="峰值帧" ok={summary?.has_peak ?? media.some((item) => item.evidence_type === 'frame_peak')} />
            <EvidenceMark label="离开后" ok={summary?.has_after ?? false} />
          </div>
          <p className="mt-3 text-label-xs leading-5 text-on-surface-variant">
            Next: prioritize peak frame, then use before/after to determine if it was a brief pass-through.
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-high p-2 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
          {media.map((item, index) => {
            const isActive = index === activeIdx;
            const isVideo = item.mime_type.startsWith('video/');
            return (
              <button
                key={item.id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-body-sm transition',
                  isActive ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )}
                onClick={() => setActiveIdx(index)}
              >
                <span className="material-symbols-outlined text-base">{isVideo ? 'movie' : 'camera'}</span>
                <span>{labels[item.evidence_type] ?? item.evidence_type}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EvidenceMark({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={cn('rounded-lg border px-2 py-2 text-center text-label-xs', ok ? 'border-primary/40 bg-primary/10 text-primary' : 'border-outline-variant bg-surface-container text-on-surface-variant')}>
      {label}
    </div>
  );
}
