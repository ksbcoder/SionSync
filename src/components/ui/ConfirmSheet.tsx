import { createPortal } from 'react-dom';
import { useIsDesktop } from '../../hooks/useMediaQuery';

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
}

export function ConfirmSheet({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Eliminar' }: ConfirmSheetProps) {
  const isDesktop = useIsDesktop();

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="w-full min-h-[44px] rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors"
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full min-h-[44px] rounded-lg bg-brand-100 text-brand-900 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  const modal = isDesktop ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        {content}
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 animate-slide-up"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {content}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
