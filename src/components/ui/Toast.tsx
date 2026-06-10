import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const STYLES: Record<ToastType, { bg: string; icon: typeof AlertCircle }> = {
  error:   { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertCircle },
  success: { bg: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  info:    { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info },
};

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      {toasts.map(toast => {
        const { bg, icon: Icon } = STYLES[toast.type];
        return (
          <div
            key={toast.id}
            role="button"
            tabIndex={0}
            onClick={() => onDismiss(toast.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onDismiss(toast.id); }}
            className={`animate-slide-up flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg cursor-pointer select-none ${bg}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <X className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
          </div>
        );
      })}
    </div>,
    document.body
  );
}
