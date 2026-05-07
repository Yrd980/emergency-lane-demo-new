interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="my-4 rounded-md border border-rose-200 bg-rose-50 p-4">
      <div className="flex items-center gap-3">
        <span className="font-medium text-rose-700">错误</span>
        <span className="text-sm text-rose-700">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
