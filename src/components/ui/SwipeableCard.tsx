import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
}

export function SwipeableCard({ children, onDelete, className = 'rounded-2xl' }: SwipeableCardProps) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const THRESHOLD = 80;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) setOffset(Math.max(diff, -THRESHOLD));
  };

  const onTouchEnd = () => {
    if (offset <= -THRESHOLD) setOffset(-THRESHOLD);
    else setOffset(0);
  };

  const reset = () => setOffset(0);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center"
        onClick={() => { onDelete(); reset(); }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>
      <div
        className="relative transition-transform duration-200"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={offset !== 0 ? reset : undefined}
      >
        {children}
      </div>
    </div>
  );
}
