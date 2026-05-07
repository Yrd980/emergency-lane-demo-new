interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="my-4 rounded-xl border border-[var(--danger-soft)]/40 bg-[var(--danger-soft)]/15 p-4">
      <div className="flex items-center gap-3">
        <span className="font-medium text-[var(--danger)]">错误</span>
        <span className="text-sm text-[var(--danger)]">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto rounded-lg bg-[var(--danger-soft)] px-3 py-1 text-sm text-[var(--danger)] hover:bg-[#b0000a] transition-all active:scale-95"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
