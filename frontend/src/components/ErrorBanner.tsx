interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="my-4 rounded-xl border border-error-container/40 bg-error-container/10 p-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-error text-base">error</span>
        <span className="font-label-xs text-label-xs text-error">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto rounded-lg bg-error-container/20 px-3 py-1 text-label-xs text-error hover:brightness-110 transition-all active:scale-95"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
