import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Presentation, Trash2 } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useSecciones } from '../../hooks/useSecciones';
import { useNotas } from '../../hooks/useNotas';
import { SeccionItem } from '../secciones/SeccionItem';
import { BottomSheet } from '../layout/BottomSheet';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { SwipeableCard } from '../ui/SwipeableCard';
import { SeccionForm } from '../secciones/SeccionForm';
import { DotLoader } from '../ui/DotLoader';
import type { Cancion, TipoSeccion } from '../../types';

export function CancionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCancion, deleteCancion } = useCanciones();
  const { addSeccion, updateSeccion, deleteSeccion, reordenarSecciones, duplicarSeccion } = useSecciones();
  const { addNota, updateNota, deleteNota } = useNotas();

  const [cancion, setCancion] = useState<Cancion | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addSeccionOpen, setAddSeccionOpen] = useState(false);
  const [confirmCancion, setConfirmCancion] = useState(false);
  const [confirmSeccionId, setConfirmSeccionId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getCancion(id);
    setCancion(data);
    setLoading(false);
  }, [id, getCancion]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteCancion(id);
    navigate('/canciones');
  };

  const handleAddSeccion = async (data: { tipo: TipoSeccion; letra: string }) => {
    if (!id || !cancion) return;
    const secciones = cancion.secciones ?? [];
    const orden = secciones.length > 0 ? Math.max(...secciones.map(s => s.orden)) + 1 : 0;
    await addSeccion({ cancion_id: id, tipo: data.tipo, letra: data.letra, orden });
    await cargar();
    setAddSeccionOpen(false);
  };

  const handleUpdateSeccion = async (seccionId: string, data: { tipo: TipoSeccion; letra: string }) => {
    await updateSeccion(seccionId, data);
    await cargar();
  };

  const handleDeleteSeccion = async () => {
    if (!confirmSeccionId) return;
    await deleteSeccion(confirmSeccionId);
    await cargar();
  };

  const handleMover = async (seccionId: string, direccion: 'arriba' | 'abajo') => {
    if (!cancion?.secciones) return;
    const secciones = [...cancion.secciones].sort((a, b) => a.orden - b.orden);
    const idx = secciones.findIndex(s => s.id === seccionId);
    if (direccion === 'arriba' && idx === 0) return;
    if (direccion === 'abajo' && idx === secciones.length - 1) return;
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
    const newOrdenes = secciones.map((s, i) => {
      if (i === idx) return { id: s.id, orden: secciones[swapIdx].orden };
      if (i === swapIdx) return { id: s.id, orden: secciones[idx].orden };
      return { id: s.id, orden: s.orden };
    });
    await reordenarSecciones(newOrdenes);
    await cargar();
  };

  const handleDuplicarSeccion = async (seccionId: string) => {
    if (!cancion) return;
    const seccion = cancion.secciones?.find(s => s.id === seccionId);
    if (!seccion) return;
    const secciones = cancion.secciones ?? [];
    const ordenSiguiente = Math.max(...secciones.map(s => s.orden)) + 1;
    await duplicarSeccion(seccion, ordenSiguiente);
    await cargar();
  };

  const handleAddNota = async (seccionId: string, contenido: string) => {
    const seccion = cancion?.secciones?.find(s => s.id === seccionId);
    const orden = seccion?.notas?.length ?? 0;
    await addNota({ seccion_id: seccionId, orden, contenido });
    await cargar();
  };

  const handleUpdateNota = async (notaId: string, contenido: string) => {
    await updateNota(notaId, contenido);
    await cargar();
  };

  const handleDeleteNota = async (notaId: string) => {
    await deleteNota(notaId);
    await cargar();
  };

  if (loading) {
    return (
      <div className="min-h-svh bg-gray-50 flex items-center justify-center">
        <DotLoader text="Cargando canción..." />
      </div>
    );
  }

  if (!cancion) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-500">Canción no encontrada</p>
        <button
          onClick={() => navigate('/canciones')}
          className="min-h-[44px] px-6 bg-brand-100 text-brand-900 rounded-lg font-medium text-sm hover:opacity-90"
        >
          Volver a canciones
        </button>
      </div>
    );
  }

  const secciones = [...(cancion.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/canciones')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800 truncate">{cancion.titulo}</h1>
        <button onClick={() => navigate(`/cancion/${id}/presentacion`)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl" title="Modo presentación">
          <Presentation className="w-5 h-5" />
        </button>
        <button onClick={() => setMenuOpen(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {(cancion.autor || cancion.tonalidad || cancion.tempo) && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto">
          {cancion.autor && <span className="text-sm text-gray-600 shrink-0">{cancion.autor}</span>}
          {cancion.tonalidad && <span className="bg-brand-100 text-brand-900 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">{cancion.tonalidad}</span>}
          {cancion.tempo && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">{cancion.tempo} BPM</span>}
        </div>
      )}

      <main className="px-4 py-4 flex flex-col gap-3 max-w-2xl mx-auto">
        {secciones.map((seccion, idx) => (
          <SwipeableCard
            key={seccion.id}
            className="rounded-xl"
            actions={[{
              icon: <Trash2 className="w-5 h-5 text-white" />,
              bg: 'bg-red-500',
              onClick: () => setConfirmSeccionId(seccion.id),
            }]}
          >
            <SeccionItem
              seccion={seccion}
              canMoveUp={idx > 0}
              canMoveDown={idx < secciones.length - 1}
              onMoveUp={() => handleMover(seccion.id, 'arriba')}
              onMoveDown={() => handleMover(seccion.id, 'abajo')}
              onDelete={() => setConfirmSeccionId(seccion.id)}
              onDuplicate={() => handleDuplicarSeccion(seccion.id)}
              onUpdate={(data) => handleUpdateSeccion(seccion.id, data)}
              onAddNota={(contenido) => handleAddNota(seccion.id, contenido)}
              onUpdateNota={handleUpdateNota}
              onDeleteNota={handleDeleteNota}
            />
          </SwipeableCard>
        ))}

      </main>

      <button
        onClick={() => setAddSeccionOpen(true)}
        className="md:hidden fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 0.75rem)' }}
        aria-label="Agregar sección"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Menú opciones */}
      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones">
        <div className="flex flex-col gap-2">
          <button onClick={() => { navigate(`/cancion/${id}/editar`); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">
            Editar canción
          </button>
          <button onClick={() => { navigate(`/cancion/${id}/presentacion`); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-brand-100 text-brand-700 font-medium">
            Modo presentación
          </button>
          <button onClick={() => { setConfirmCancion(true); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-red-50 text-red-500 font-medium">
            Eliminar canción
          </button>
        </div>
      </BottomSheet>

      {/* Agregar sección */}
      <BottomSheet isOpen={addSeccionOpen} onClose={() => setAddSeccionOpen(false)} title="Nueva Sección">
        <SeccionForm
          cancionId={id!}
          ordenSiguiente={(cancion.secciones?.length ?? 0)}
          onGuardar={handleAddSeccion}
          onCancelar={() => setAddSeccionOpen(false)}
        />
      </BottomSheet>

      {/* Confirmar eliminar canción */}
      <ConfirmSheet
        isOpen={confirmCancion}
        onClose={() => setConfirmCancion(false)}
        onConfirm={handleDelete}
        title="¿Eliminar esta canción?"
        description="Se eliminarán todas sus secciones y acordes. Esta acción no se puede deshacer."
      />

      {/* Confirmar eliminar sección */}
      <ConfirmSheet
        isOpen={!!confirmSeccionId}
        onClose={() => setConfirmSeccionId(null)}
        onConfirm={handleDeleteSeccion}
        title="¿Eliminar esta sección?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
