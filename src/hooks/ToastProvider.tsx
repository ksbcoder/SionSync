import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { ToastContext, type ToastType } from './useToast';

// Duración por tipo (ms): los avisos buenos se van rápido; los errores se
// quedan un poco más para alcanzar a leerlos.
const DURACION: Record<ToastType, number> = {
  success: 2000,
  info: 3000,
  error: 3500,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    toast[type](message, { duration: DURACION[type] });
  }, []);

  // Cerrar al tocar la notificación: Sonner no trae clic-para-cerrar, así que
  // escuchamos el clic sobre el área de toasts y lo cerramos a mano.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-sonner-toast]')) toast.dismiss();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div ref={containerRef}>
        <Toaster
          position="bottom-center"
          richColors
          closeButton
          toastOptions={{ style: { textAlign: 'left' } }}
        />
      </div>
    </ToastContext.Provider>
  );
}
