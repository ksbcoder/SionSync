import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, X, Plus } from 'lucide-react';
import { BottomSheet } from '../layout/BottomSheet';
import { DotLoader } from '../ui/DotLoader';
import { useCanciones } from '../../hooks/useCanciones';
import { useRoles } from '../../hooks/useRoles';
import { useToast } from '../../hooks/useToast';
import type { Cancion } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sesionId: string;
  /** Ids de canciones que ya están en la sesión (se excluyen del listado). */
  idsEnSesion: Set<string>;
  /** Agrega las canciones elegidas a la sesión. Devuelve si salió bien. */
  onAgregar: (cancionIds: string[]) => Promise<boolean>;
}

export function AgregarCancionesSheet({ isOpen, onClose, sesionId, idsEnSesion, onAgregar }: Props) {
  const navigate = useNavigate();
  const { getCanciones, loading } = useCanciones();
  const { canCreateCanciones } = useRoles();
  const { showToast } = useToast();
  const [catalogo, setCatalogo] = useState<Cancion[]>([]);
  const [query, setQuery] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSeleccionados(new Set());
    getCanciones().then(data => setCatalogo(data ?? []));
  }, [isOpen, getCanciones]);

  // Canciones del catálogo que aún no están en la sesión, filtradas por búsqueda.
  const disponibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogo
      .filter(c => !idsEnSesion.has(c.id))
      .filter(c => !q || c.titulo.toLowerCase().includes(q) || c.autor?.toLowerCase().includes(q));
  }, [catalogo, idsEnSesion, query]);

  const toggle = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAgregar = async () => {
    if (seleccionados.size === 0) return;
    setGuardando(true);
    try {
      const ok = await onAgregar(Array.from(seleccionados));
      if (ok) {
        showToast(`${seleccionados.size} ${seleccionados.size === 1 ? 'canción agregada' : 'canciones agregadas'}`, 'success');
        onClose();
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Agregar canciones">
      <div className="flex flex-col gap-3">
        {canCreateCanciones && (
          <button
            onClick={() => navigate(`/cancion/nueva?sesion=${sesionId}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Crear una canción nueva</span>
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="w-full h-11 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Buscar en el catálogo..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading && !catalogo.length ? (
          <DotLoader text="Cargando catálogo..." />
        ) : disponibles.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {query ? `No se encontró "${query}"` : 'No hay más canciones en el catálogo para agregar'}
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto">
            {disponibles.map(cancion => {
              const selected = seleccionados.has(cancion.id);
              return (
                <button
                  key={cancion.id}
                  onClick={() => toggle(cancion.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                    selected ? 'bg-brand-50 border-2 border-brand-300' : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 break-words">{cancion.titulo}</span>
                    {cancion.autor ? (
                      <span className="block text-xs text-gray-400 break-words">{cancion.autor}</span>
                    ) : (
                      cancion.descripcion && <span className="block text-xs text-gray-400 italic break-words">{cancion.descripcion}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {cancion.tonalidad && <span className="w-px h-8 bg-gray-200 self-center" aria-hidden="true" />}
                    {cancion.tonalidad && (
                      <span className="bg-brand-100 text-brand-900 px-2 py-0.5 rounded-full text-xs font-medium">
                        {cancion.tonalidad}
                      </span>
                    )}
                    {selected && <Check className="w-5 h-5 text-brand-700" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={handleAgregar}
          disabled={guardando || seleccionados.size === 0}
          className="w-full min-h-[44px] rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando
            ? 'Agregando...'
            : seleccionados.size > 0
              ? `Agregar ${seleccionados.size} ${seleccionados.size === 1 ? 'canción' : 'canciones'}`
              : 'Selecciona canciones'}
        </button>
      </div>
    </BottomSheet>
  );
}
