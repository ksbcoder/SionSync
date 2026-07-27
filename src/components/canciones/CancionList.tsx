import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, X } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useRealtime } from '../../hooks/useRealtime';
import { useRecargarAlVolver } from '../../hooks/useRecargarAlVolver';
import { useRoles } from '../../hooks/useRoles';
import { useToast } from '../../hooks/useToast';
import { CancionCard } from './CancionCard';
import { TabsCanciones } from './TabsCanciones';
import { OrbeLoader } from '../ui/OrbeLoader';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import type { Cancion } from '../../domain';

export function CancionList() {
  const navigate = useNavigate();
  const { getCanciones, deleteCancion, loading } = useCanciones();
  const { canCreateCanciones } = useRoles();
  const { showToast } = useToast();
  const [todasCanciones, setTodasCanciones] = useState<Cancion[]>([]);
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cargar = useCallback(async () => {
    const data = await getCanciones();
    setTodasCanciones(data ?? []);
  }, [getCanciones]);

  useEffect(() => { cargar(); }, [cargar]);

  // En vivo + recarga al volver a la app, para no quedar con la lista vieja.
  useRealtime(['canciones'], cargar);
  useRecargarAlVolver(cargar);

  const canciones = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return todasCanciones;
    return todasCanciones.filter(c =>
      c.titulo.toLowerCase().includes(q) ||
      c.autor?.toLowerCase().includes(q)
    );
  }, [query, todasCanciones]);

  const handleDelete = async () => {
    if (!confirmId) return;
    const ok = await deleteCancion(confirmId);
    if (ok) {
      setTodasCanciones(prev => prev.filter(c => c.id !== confirmId));
      showToast('Canción eliminada', 'success');
    }
  };

  return (
    <div className="min-h-svh bg-[#f8faff]">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-30">
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800">Canciones</h1>
      </header>

      <div className="px-4 pt-3">
        <TabsCanciones activa="catalogo" />
      </div>

      <div className="sticky top-[57px] bg-[#f8faff] px-4 pt-3 pb-2 z-20">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="w-full h-12 pl-10 pr-10 bg-white border border-gray-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Buscar canciones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <main className="px-4 pb-safe-nav pt-2 max-w-2xl mx-auto">
        {loading && !canciones.length ? (
          <OrbeLoader text="Cargando canciones..." />
        ) : canciones.length === 0 ? (
          <EmptyState
            title={query ? 'Sin resultados' : 'No hay canciones aún'}
            description={query ? `No se encontró "${query}"` : 'Agrega tu primera canción de alabanza'}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {canciones.map(c => (
              <CancionCard key={c.id} cancion={c} onDelete={(id) => setConfirmId(id)} />
            ))}
          </div>
        )}
      </main>

      {canCreateCanciones && (
        <button
          onClick={() => navigate('/cancion/nueva')}
          className="fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          aria-label="Nueva canción"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <ConfirmSheet
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar esta canción?"
        description="Se eliminarán todas sus secciones y acordes. Esta acción no se puede deshacer."
      />
    </div>
  );
}
