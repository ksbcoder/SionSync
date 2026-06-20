import { useCallback, type ReactNode } from 'react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { ToastContext, type ToastType } from './useToast';

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    sileo[type]({ title: message, duration: 4000 });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="bottom-center" />
    </ToastContext.Provider>
  );
}
