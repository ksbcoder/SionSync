import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { CuerpoPresentacion } from './CuerpoPresentacion';
import type { Cancion } from '../../domain';

export function CancionPresentacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCancion } = useCanciones();
  const [cancion, setCancion] = useState<Cancion | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { autoScroll, setAutoScroll, velocidad, subirVelocidad, bajarVelocidad } = useAutoScroll(scrollRef);

  useEffect(() => {
    if (!id) return;
    getCancion(id).then(setCancion);
  }, [id, getCancion]);

  if (!cancion) return null;

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
                onClick={bajarVelocidad}
                className="min-h-[48px] min-w-[36px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors text-lg font-bold"
              >
                −
              </button>
              <span className="text-white/50 text-sm w-6 text-center">{velocidad}</span>
              <button
                onClick={subirVelocidad}
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

      {cancion.tempo && (
        <p className="text-stage-muted text-sm text-center pb-2 shrink-0">{cancion.tempo} BPM</p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-8">
        <CuerpoPresentacion cancion={cancion} />
      </div>
    </div>
  );
}
