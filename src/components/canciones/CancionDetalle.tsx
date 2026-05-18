import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Presentation, PlusSquare } from 'lucide-react';
import { useCanciones } from '../../hooks/useCanciones';
import { useSecciones } from '../../hooks/useSecciones';
import { useNotas } from '../../hooks/useNotas';
import { SeccionItem } from '../secciones/SeccionItem';
import { BottomSheet } from '../layout/BottomSheet';
import { SeccionForm } from '../secciones/SeccionForm';
import { SkeletonList } from '../ui/Skeleton';
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

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getCancion(id);
    setCancion(data);
    setLoading(false);
  }, [id, getCancion]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta canción y todas sus secciones?')) return;
    await deleteCancion(id);
    navigate('/');
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

  const handleDeleteSeccion = async (seccionId: string) => {
    if (!confirm('¿Eliminar esta sección?')) return;
    await deleteSeccion(seccionId);
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
      <div className="min-h-svh bg-gray-50 p-4">
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!cancion) {
    return (
      <div className="min-h-svh bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Canción no encontrada</p>
      </div>
    );
  }

  const secciones = [...(cancion.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-800 truncate">{cancion.titulo}</h1>
        <button onClick={() => setAddSeccionOpen(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Agregar sección">
          <PlusSquare className="w-5 h-5" />
        </button>
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
          {cancion.tonalidad && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">{cancion.tonalidad}</span>}
          {cancion.tempo && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">{cancion.tempo} BPM</span>}
        </div>
      )}

      <main className="px-4 py-4 flex flex-col gap-3 max-w-2xl mx-auto">
        {secciones.map((seccion, idx) => (
          <SeccionItem
            key={seccion.id}
            seccion={seccion}
            canMoveUp={idx > 0}
            canMoveDown={idx < secciones.length - 1}
            onMoveUp={() => handleMover(seccion.id, 'arriba')}
            onMoveDown={() => handleMover(seccion.id, 'abajo')}
            onDelete={() => handleDeleteSeccion(seccion.id)}
            onDuplicate={() => handleDuplicarSeccion(seccion.id)}
            onUpdate={(data) => handleUpdateSeccion(seccion.id, data)}
            onAddNota={(contenido) => handleAddNota(seccion.id, contenido)}
            onUpdateNota={handleUpdateNota}
            onDeleteNota={handleDeleteNota}
          />
        ))}

        <button
          onClick={() => setAddSeccionOpen(true)}
          className="w-full h-12 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar Sección
        </button>
      </main>

      {/* Menú opciones */}
      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones">
        <div className="flex flex-col gap-2">
          <button onClick={() => { navigate(`/cancion/${id}/editar`); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">
            Editar canción
          </button>
          <button onClick={() => { navigate(`/cancion/${id}/presentacion`); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-indigo-50 text-indigo-600 font-medium">
            Modo presentación
          </button>
          <button onClick={() => { handleDelete(); setMenuOpen(false); }}
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
    </div>
  );
}
