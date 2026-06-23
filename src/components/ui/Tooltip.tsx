import { useState, useRef, useLayoutEffect, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIsDesktop } from '../../hooks/useMediaQuery';

interface TooltipProps {
  /** Texto o contenido que se muestra en la burbuja */
  content: ReactNode;
  /** El elemento que dispara el tooltip (normalmente un ícono) */
  children: ReactNode;
}

interface Coords {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const WIDTH = 240;
const GAP = 8;

export function Tooltip({ content, children }: TooltipProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [coords, setCoords] = useState<Coords | null>(null);

  // Calcula dónde poner la burbuja a partir de la posición del trigger
  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(WIDTH, vw - 16);
    const centerX = rect.left + rect.width / 2;
    const left = Math.min(Math.max(centerX - width / 2, 8), vw - width - 8);
    // Si hay poco espacio arriba, la mostramos abajo
    const placement: Coords['placement'] = rect.top > 96 ? 'top' : 'bottom';
    const top = placement === 'top' ? rect.top - GAP : rect.bottom + GAP;
    setCoords({ top, left, placement });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Al hacer scroll o cambiar el tamaño cerramos para no dejar la burbuja flotando mal ubicada
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const desktopHandlers = isDesktop
    ? {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    if (isDesktop) return;
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const bubble =
    open && coords
      ? createPortal(
          <>
            {/* Capa invisible: tocar fuera cierra la burbuja (solo móvil) */}
            {!isDesktop && (
              <div
                className="fixed inset-0 z-[60]"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
              />
            )}
            <div
              role="tooltip"
              className="fixed z-[61] rounded-lg bg-slate-900 px-3 py-2 text-xs leading-snug text-white shadow-lg ring-1 ring-white/10 animate-fade-in"
              style={{
                top: coords.top,
                left: coords.left,
                width: Math.min(WIDTH, window.innerWidth - 16),
                transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
              }}
            >
              {content}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      {...desktopHandlers}
      onClick={handleClick}
    >
      {children}
      {bubble}
    </span>
  );
}
