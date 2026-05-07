import { useMemo, useState } from 'react';
import { Camera, Film, ImageOff } from 'lucide-react';
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
      <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-raised)] p-8 text-center">
        <ImageOff className="mx-auto h-8 w-8 text-[var(--faint)]" />
        <div className="mt-3 font-semibold text-[var(--text)]">证据还没有上传完成</div>
        <p className="mt-2 text-sm text-[var(--muted)]">下一步：检查 Android 队列和设备网络，等待补传后刷新事件。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="overflow-hidden rounded-xl border border-[#2c2c35] bg-[#13131b] shadow-[0_18px_46px_rgba(32,32,29,0.12)]">
        <div className="flex min-h-[300px] items-center justify-center sm:min-h-[480px]">
          {active?.mime_type.startsWith('image/') ? (
            <img src={active.url} alt={labels[active.evidence_type] ?? active.evidence_type} className="max-h-[68vh] max-w-full object-contain" />
          ) : (
            <video controls className="max-h-[68vh] max-w-full" src={active?.url} />
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-4 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
          <div className="text-sm font-semibold text-[var(--text)]">证据链完整度</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <EvidenceMark label="进入前" ok={summary?.has_before ?? false} />
            <EvidenceMark label="峰值帧" ok={summary?.has_peak ?? media.some((item) => item.evidence_type === 'frame_peak')} />
            <EvidenceMark label="离开后" ok={summary?.has_after ?? false} />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            下一步：优先查看峰值帧，再用进入前/离开后判断是否短暂经过。
          </p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] p-2 shadow-[0_1px_0_rgba(32,32,29,0.04)]">
          {media.map((item, index) => {
            const isActive = index === activeIdx;
            const isVideo = item.mime_type.startsWith('video/');
            return (
              <button
                key={item.id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                  isActive ? 'bg-[var(--text)] text-[var(--surface)]' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]',
                )}
                onClick={() => setActiveIdx(index)}
              >
                {isVideo ? <Film className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
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
    <div className={cn('rounded-lg border px-2 py-2 text-center text-xs', ok ? 'border-[var(--brand-soft)]/40 bg-[var(--brand-soft)]/10 text-[var(--brand)]' : 'border-[var(--line)] bg-[var(--surface)] text-[var(--faint)]')}>
      {label}
    </div>
  );
}
