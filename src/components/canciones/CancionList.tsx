import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { CancionCard } from './CancionCard';
import { DotLoader } from '../ui/DotLoader';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { Header } from '../layout/Header';
import type { Cancion } from '../../domain';

export function CancionList() {
  const navigate = useNavigate();
  const { getCanciones, buscarCanciones, deleteCancion, loading } = useCanciones();
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const data = query.trim() ? await buscarCanciones(query) : await getCanciones();
    setCanciones(data ?? []);
  }, [query, getCanciones, buscarCanciones]);

  useEffect(() => {
    const timer = setTimeout(cargar, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [cargar, query]);

  const handleDelete = async () => {
    if (!confirmId) return;
    await deleteCancion(confirmId);
    setCanciones(prev => prev.filter(c => c.id !== confirmId));
  };

  return (
    <div className="min-h-svh bg-[#f8faff]">
      <Header onNuevaCancion={() => navigate('/cancion/nueva')} />

      <div className="sticky top-0 bg-[#f8faff] px-4 pt-4 pb-2 z-20 md:top-[65px]">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Buscar canciones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="px-4 pb-safe-nav pt-2 max-w-2xl mx-auto">
        {loading && !canciones.length ? (
          <DotLoader text="Cargando canciones..." />
        ) : canciones.length === 0 ? (
          <EmptyState
            title={query ? 'Sin resultados' : 'No hay canciones aún'}
            description={query ? `No se encontró "${query}"` : 'Agrega tu primera canción de alabanza'}
          />
        ) : (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {canciones.map(c => (
              <CancionCard key={c.id} cancion={c} onDelete={(id) => setConfirmId(id)} />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => navigate('/cancion/nueva')}
        className="md:hidden fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 0.75rem)' }}
        aria-label="Nueva canción"
      >
        <Plus className="w-6 h-6" />
      </button>

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
