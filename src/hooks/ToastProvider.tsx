import { useCallback, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { ToastContext, type ToastType } from './useToast';

const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    toast[type](message);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        duration={TOAST_DURATION}
        toastOptions={{ style: { textAlign: 'left' } }}
      />
    </ToastContext.Provider>
  );
}
