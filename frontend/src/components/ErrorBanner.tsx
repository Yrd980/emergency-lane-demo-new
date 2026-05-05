interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex items-center gap-3">
        <span className="text-red-600 font-medium">错误</span>
        <span className="text-red-700 text-sm">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
