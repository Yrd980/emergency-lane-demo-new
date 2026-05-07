import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext, type ToastTone } from './toastContext';

type ToastItem = { id: number; message: string; tone: ToastTone };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border glass-panel px-4 py-3 text-sm ${
              item.tone === 'error' ? 'border-[var(--danger-soft)]/40 text-[var(--danger)]' : 'border-[var(--line)]/20 text-[var(--text)]'
            }`}
          >
            {item.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
            ) : (
              <Info className="h-4 w-4 text-[var(--brand)]" />
            )}
            <span className="flex-1">{item.message}</span>
            <button
              aria-label="关闭提示"
              onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
              className="rounded p-1 text-[var(--faint)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
