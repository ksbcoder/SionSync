import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { SeccionBadge } from '../secciones/SeccionBadge';
import { NotasDisplay } from '../notas/NotasDisplay';
import type { Cancion } from '../../types';

export function CancionPresentacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCancion } = useCanciones();
  const [cancion, setCancion] = useState<Cancion | null>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const velocidadRef = useRef(velocidad);
  const lastTimeRef = useRef<number | null>(null);
  const accumRef = useRef(0);

  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);

  useEffect(() => {
    if (!id) return;
    getCancion(id).then(setCancion);
  }, [id, getCancion]);

  // px/segundo = velocidad * 3 → rango: 3px/s (vel 1) a 30px/s (vel 10)
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
  }, []);

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

  if (!cancion) return null;

  const secciones = [...(cancion.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  return (
    <div className="fixed inset-0 bg-stage-bg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-xl text-center flex-1 px-2 truncate">{cancion.titulo}</h1>
        <div className="flex items-center gap-1">
          {autoScroll && (
            <>
              <button
                onClick={() => setVelocidad(v => Math.max(1, v - 1))}
                className="min-h-[48px] min-w-[36px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors text-lg font-bold"
              >
                −
              </button>
              <span className="text-white/50 text-sm w-4 text-center">{velocidad}</span>
              <button
                onClick={() => setVelocidad(v => Math.min(10, v + 1))}
                className="min-h-[48px] min-w-[36px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors text-lg font-bold"
              >
                +
              </button>
            </>
          )}
          <button
            onClick={() => setAutoScroll(v => !v)}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors"
            title="Auto-scroll"
          >
            {autoScroll ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {cancion.autor && (
        <p className="text-gray-400 text-sm text-center pb-2 shrink-0">{cancion.autor}</p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
          {secciones.map(seccion => (
            <div key={seccion.id}>
              <div className="mb-3">
                <SeccionBadge tipo={seccion.tipo} />
              </div>
              {seccion.notas && seccion.notas.length > 0 && (
                <NotasDisplay notas={seccion.notas} presentacion />
              )}
              <p className="text-xl leading-loose text-stage-text whitespace-pre-wrap">{seccion.letra}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
