import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSesiones } from '../../hooks/useSesiones';
import { useRealtime } from '../../hooks/useRealtime';
import { useRecargarAlVolver } from '../../hooks/useRecargarAlVolver';
import { useRoles } from '../../hooks/useRoles';
import { useToast } from '../../hooks/useToast';
import { TabsCanciones } from '../canciones/TabsCanciones';
import { SesionCard } from './SesionCard';
import { SesionFormSheet } from './SesionFormSheet';
import { OrbeLoader } from '../ui/OrbeLoader';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import type { Sesion } from '../../domain';

export function SesionList() {
  const navigate = useNavigate();
  const { getSesiones, deleteSesion, loading } = useSesiones();
  const { canCreateCanciones } = useRoles();
  const { showToast } = useToast();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Sesion | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const cargar = useCallback(async () => {
    const data = await getSesiones();
    setSesiones(data ?? []);
  }, [getSesiones]);

  useEffect(() => { cargar(); }, [cargar]);

  // En vivo + recarga al volver a la app, para no quedar con la lista vieja.
  useRealtime(['sesiones', 'sesion_canciones'], cargar);
  useRecargarAlVolver(cargar);

  const abrirNueva = () => { setEditando(null); setFormOpen(true); };
  const abrirEdicion = (sesion: Sesion) => { setEditando(sesion); setFormOpen(true); };

  const handleDelete = async () => {
    if (!confirmId) return;
    const ok = await deleteSesion(confirmId);
    if (ok) {
      setSesiones(prev => prev.filter(s => s.id !== confirmId));
      showToast('Sesión eliminada', 'success');
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

      <div className="px-4 pt-3 pb-2">
        <TabsCanciones activa="sesiones" />
      </div>

      <main className="px-4 pb-safe-nav pt-1 max-w-2xl mx-auto">
        {loading && !sesiones.length ? (
          <OrbeLoader text="Cargando sesiones..." />
        ) : sesiones.length === 0 ? (
          <EmptyState
            title="No hay sesiones aún"
            description={
              canCreateCanciones
                ? 'Crea una sesión para agrupar las canciones de un día'
                : 'Todavía no se ha creado ninguna sesión'
            }
          />
        ) : (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {sesiones.map(s => (
              <SesionCard key={s.id} sesion={s} onEdit={abrirEdicion} onDelete={setConfirmId} />
            ))}
          </div>
        )}
      </main>

      {canCreateCanciones && (
        <button
          onClick={abrirNueva}
          className="fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          aria-label="Nueva sesión"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <SesionFormSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        sesionExistente={editando}
        onGuardado={(sesion) => {
          // Si fue creación, entramos directo a la sesión para agregarle canciones.
          // Si fue edición, actualizamos esa tarjeta en el sitio (sin recargar la
          // lista), conservando su conteo de canciones.
          if (!editando) navigate(`/sesion/${sesion.id}`);
          else setSesiones(prev => prev.map(s => s.id === sesion.id ? { ...s, ...sesion } : s));
        }}
      />

      <ConfirmSheet
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar esta sesión?"
        description="Se eliminará la sesión y su lista de canciones. Las canciones seguirán en el catálogo. Esta acción no se puede deshacer."
      />
    </div>
  );
}
