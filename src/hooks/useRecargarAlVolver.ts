import { useEffect, useRef } from 'react';

/**
 * Ejecuta `onVolver` cuando la app vuelve a primer plano (el usuario regresa a
 * la pestaña o desbloquea el móvil). Sirve como red de seguridad para refrescar
 * los datos por si el tiempo real se perdió mientras la app estaba en segundo
 * plano. Evita recargas innecesarias si el regreso fue casi inmediato.
 */
export function useRecargarAlVolver(onVolver: () => void, minOcultoMs = 5000) {
  const callbackRef = useRef(onVolver);
  callbackRef.current = onVolver;

  useEffect(() => {
    let ocultoDesde: number | null = null;

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        ocultoDesde = Date.now();
        return;
      }
      const tiempoOculto = ocultoDesde ? Date.now() - ocultoDesde : 0;
      ocultoDesde = null;
      if (tiempoOculto >= minOcultoMs) callbackRef.current();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [minOcultoMs]);
}
