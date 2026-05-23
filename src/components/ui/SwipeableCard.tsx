import React, { useRef, useState, useEffect } from 'react';

const ACTION_WIDTH = 68;

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
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const panelWidth = actions.length * ACTION_WIDTH;

  // Cierra el swipe al hacer click fuera o al hacer scroll
  useEffect(() => {
    if (offset === 0) return;
    const close = () => setOffset(0);
    document.addEventListener('click', close, { capture: true });
    document.addEventListener('scroll', close, { passive: true, capture: true });
    return () => {
      document.removeEventListener('click', close, { capture: true });
      document.removeEventListener('scroll', close, { capture: true });
    };
  }, [offset]);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) setOffset(Math.max(diff, -panelWidth));
  };

  const onTouchEnd = () => {
    if (offset <= -ACTION_WIDTH) setOffset(-panelWidth);
    else setOffset(0);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: panelWidth }}>
        {actions.map((action, i) => (
          <button
            key={i}
            className={`flex-1 flex items-center justify-center ${action.bg}`}
            onClick={() => { action.onClick(); setOffset(0); }}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div
        className="relative transition-transform duration-200"
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
