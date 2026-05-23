import React, { useRef, useState, useEffect } from 'react';

const ACTION_WIDTH = 68;
const DEAD_ZONE = 10; // px antes de decidir dirección horizontal vs vertical

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
  const startX = useRef(0);
  const startY = useRef(0);
  const baseOffset = useRef(0);
  const dragging = useRef(false);
  const decided = useRef<'h' | 'v' | null>(null);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const panelWidth = actions.length * ACTION_WIDTH;

  // Cierra al tocar fuera de la card o al hacer scroll
  useEffect(() => {
    if (offset === 0) return;

    const handleOutsideTouch = (e: TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setAnimating(true);
        setOffset(0);
      }
    };
    const handleScroll = () => {
      setAnimating(true);
      setOffset(0);
    };

    document.addEventListener('touchstart', handleOutsideTouch, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener('touchstart', handleOutsideTouch);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [offset]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    baseOffset.current = offset;
    dragging.current = true;
    decided.current = null;
    setAnimating(false); // Sin transición CSS durante el drag
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Zona muerta: decidir si es swipe horizontal o scroll vertical
    if (!decided.current) {
      if (Math.abs(dx) > DEAD_ZONE || Math.abs(dy) > DEAD_ZONE) {
        decided.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      return;
    }

    if (decided.current === 'v') return; // Dejar que la lista haga scroll

    const newOffset = Math.max(-panelWidth, Math.min(0, baseOffset.current + dx));
    setOffset(newOffset);
  };

  const onTouchEnd = () => {
    dragging.current = false;

    if (decided.current === 'h') {
      // Snap: si pasó el umbral de un botón, abrir; si no, cerrar
      setAnimating(true);
      setOffset(offset <= -ACTION_WIDTH ? -panelWidth : 0);
    } else if (baseOffset.current !== 0) {
      // Tap sobre la card abierta sin movimiento → cerrar
      setAnimating(true);
      setOffset(0);
    }

    decided.current = null;
  };

  return (
    <div ref={cardRef} className={`relative overflow-hidden ${className}`}>
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: panelWidth }}>
        {actions.map((action, i) => (
          <button
            key={i}
            className={`flex-1 flex items-center justify-center ${action.bg}`}
            onClick={() => { action.onClick(); setAnimating(true); setOffset(0); }}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div
        className={`relative ${animating ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
