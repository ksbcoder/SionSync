import React, { useRef, useState, useEffect } from 'react';

const ACTION_WIDTH = 68;
const DEAD_ZONE = 10;
const SNAP_THRESHOLD = 40; // px para fijar abierto (después de la zona muerta)

export interface SwipeAction {
  icon: React.ReactNode;
  bg: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
}

export function SwipeableCard({ children, actions, className = 'rounded-2xl' }: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const baseOffset = useRef(0);
  const currentOffset = useRef(0); // Siempre tiene el valor real, sin stale closure
  const dragging = useRef(false);
  const decided = useRef<'h' | 'v' | null>(null);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const panelWidth = actions.length * ACTION_WIDTH;

  // Cierra al tocar fuera de la card o al hacer scroll
  useEffect(() => {
    if (offset === 0) return;

    let active = true;

    const handleOutsideTouch = (e: TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setAnimating(true);
        setOffset(0);
        currentOffset.current = 0;
      }
    };
    const handleScroll = () => {
      setAnimating(true);
      setOffset(0);
      currentOffset.current = 0;
    };

    // Pequeño delay para no capturar scroll residual del gesto
    const timer = setTimeout(() => {
      if (!active) return;
      document.addEventListener('touchstart', handleOutsideTouch, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    }, 100);

    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('touchstart', handleOutsideTouch);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [offset]);

  // Gestos con listeners nativos: el touchmove debe ser NO pasivo para poder
  // bloquear el scroll vertical mientras se desliza en horizontal. React monta
  // sus listeners de touch como pasivos, donde preventDefault no tiene efecto
  // (y avisa por consola); por eso los registramos a mano sobre el elemento.
  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      baseOffset.current = currentOffset.current;
      dragging.current = true;
      decided.current = null;
      setAnimating(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (!decided.current) {
        if (Math.abs(dx) > DEAD_ZONE || Math.abs(dy) > DEAD_ZONE) {
          decided.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }
        return;
      }

      if (decided.current === 'v') return;

      e.preventDefault(); // Bloquear scroll vertical mientras se desliza horizontalmente

      const val = Math.max(-panelWidth, Math.min(0, baseOffset.current + dx));
      currentOffset.current = val;

      // Fijar abierto solo si estaba cerrada y pasó el umbral
      if (val <= -SNAP_THRESHOLD && baseOffset.current === 0) {
        dragging.current = false;
        decided.current = null;
        currentOffset.current = -panelWidth;
        setAnimating(true);
        setOffset(-panelWidth);
        return;
      }

      setOffset(val);
    };

    const onTouchEnd = () => {
      dragging.current = false;

      if (decided.current === 'h' || baseOffset.current !== 0) {
        // Cualquier gesto horizontal o tap en card abierta → cerrar
        setAnimating(true);
        currentOffset.current = 0;
        setOffset(0);
      }

      decided.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [panelWidth]);

  return (
    <div ref={cardRef} className={`relative overflow-hidden ${className}`}>
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: panelWidth }}>
        {actions.map((action, i) => (
          <button
            key={i}
            className={`flex-1 flex items-center justify-center ${action.bg}`}
            onClick={() => { action.onClick(); setAnimating(true); currentOffset.current = 0; setOffset(0); }}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div
        ref={dragRef}
        className={`relative ${animating ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${offset}px)`, touchAction: 'pan-y' }}
      >
        {children}
      </div>
    </div>
  );
}
