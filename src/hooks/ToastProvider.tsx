import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { ToastContext, type ToastType } from './useToast';

const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  // Respaldo de cierre: en móviles el "hover" táctil puede quedarse pegado y
  // Sileo nunca vuelve a programar el cierre, dejando la notificación en
  // pantalla incluso al cambiar de vista. Cerramos nosotros por nuestra cuenta.
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = sileo[type]({ title: message, duration: TOAST_DURATION });

    const timers = dismissTimersRef.current;
    const pending = timers.get(id);
    if (pending) clearTimeout(pending);

    timers.set(
      id,
      setTimeout(() => {
        sileo.dismiss(id);
        timers.delete(id);
      }, TOAST_DURATION + 150),
    );
  }, []);

  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="bottom-center" />
    </ToastContext.Provider>
  );
}
