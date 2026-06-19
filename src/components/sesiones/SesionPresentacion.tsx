import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSesiones } from '../../hooks/useSesiones';
import { useCanciones } from '../../hooks/useCanciones';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { CuerpoPresentacion } from '../canciones/CuerpoPresentacion';
import { DotLoader } from '../ui/DotLoader';
import type { Cancion } from '../../domain';

export function SesionPresentacion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSesion } = useSesiones();
  const { getCancion } = useCanciones();
  const [canciones, setCanciones] = useState<Cancion[] | null>(null);
  const [indice, setIndice] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { autoScroll, setAutoScroll, velocidad, subirVelocidad, bajarVelocidad, reiniciar } = useAutoScroll(scrollRef);

  // Carga la sesión y, en su orden, cada canción completa (con secciones y acordes).
  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    getSesion(id).then(async sesion => {
      if (!sesion) { if (!cancelado) setCanciones([]); return; }
      const ordenadas = [...sesion.canciones].sort((a, b) => a.orden - b.orden);
      const completas = await Promise.all(ordenadas.map(sc => getCancion(sc.cancion_id)));
      if (!cancelado) setCanciones(completas.filter((c): c is Cancion => c !== null));
    });
    return () => { cancelado = true; };
  }, [id, getSesion, getCancion]);

  // Al cambiar de canción, volvemos el contenido al inicio.
  useEffect(() => { reiniciar(); }, [indice, reiniciar]);

  if (!canciones) {
    return (
      <div className="fixed inset-0 bg-stage-bg flex items-center justify-center">
        <DotLoader />
      </div>
    );
  }

  if (canciones.length === 0) {
    return (
      <div className="fixed inset-0 bg-stage-bg flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-stage-muted">Esta sesión no tiene canciones</p>
        <button onClick={() => navigate(-1)} className="min-h-[44px] px-6 bg-white/10 text-white rounded-lg font-medium text-sm">
          Volver
        </button>
      </div>
    );
  }

  const cancion = canciones[indice];
  const hayAnterior = indice > 0;
  const haySiguiente = indice < canciones.length - 1;

  return (
    <div className="fixed inset-0 bg-stage-bg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center text-white/60 hover:text-white rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0 px-2 text-center">
          <h1 className="text-white font-bold text-xl truncate">{cancion.titulo}</h1>
          <p className="text-stage-muted text-xs">Canción {indice + 1} de {canciones.length}</p>
        </div>
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

      {/* Barra inferior: navegar entre canciones de la sesión */}
      <div
        className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setIndice(i => Math.max(0, i - 1))}
          disabled={!hayAnterior}
          className="flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-5 h-5" /> Anterior
        </button>
        <span className="text-stage-muted text-sm tabular-nums">{indice + 1} / {canciones.length}</span>
        <button
          onClick={() => setIndice(i => Math.min(canciones.length - 1, i + 1))}
          disabled={!haySiguiente}
          className="flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-white/80 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-colors text-sm font-medium"
        >
          Siguiente <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
