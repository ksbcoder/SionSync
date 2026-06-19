import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Desplaza solo (auto-scroll) el contenedor referenciado mientras está activo.
 * Expone el estado para encender/apagar y para subir o bajar la velocidad.
 *
 * Usa requestAnimationFrame con un acumulador de píxeles para que el avance sea
 * suave e independiente de los cuadros por segundo del dispositivo.
 */
export function useAutoScroll<T extends HTMLElement>(scrollRef: RefObject<T | null>) {
  const [autoScroll, setAutoScroll] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const animRef = useRef<number>(0);
  const velocidadRef = useRef(velocidad);
  const lastTimeRef = useRef<number | null>(null);
  const accumRef = useRef(0);

  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);

  // px/segundo = velocidad * 3 → rango: 3px/s (vel 1) a 45px/s (vel 15)
  const scroll = useCallback((timestamp: number) => {
    if (lastTimeRef.current !== null && scrollRef.current) {
      const delta = timestamp - lastTimeRef.current;
      accumRef.current += (velocidadRef.current * 3 * delta) / 1000;
      const px = Math.floor(accumRef.current);
      if (px >= 1) {
        scrollRef.current.scrollTop += px;
        accumRef.current -= px;
      }
    }
    lastTimeRef.current = timestamp;
    animRef.current = requestAnimationFrame(scroll);
  }, [scrollRef]);

  useEffect(() => {
    if (autoScroll) {
      lastTimeRef.current = null;
      accumRef.current = 0;
      animRef.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [autoScroll, scroll]);

  // Vuelve el contenido al inicio y reinicia el acumulador (útil al cambiar de
  // canción dentro de una sesión sin apagar el auto-scroll).
  const reiniciar = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    lastTimeRef.current = null;
    accumRef.current = 0;
  }, [scrollRef]);

  const subirVelocidad = useCallback(() => setVelocidad(v => Math.min(15, v + 1)), []);
  const bajarVelocidad = useCallback(() => setVelocidad(v => Math.max(1, v - 1)), []);

  return { autoScroll, setAutoScroll, velocidad, subirVelocidad, bajarVelocidad, reiniciar };
}
