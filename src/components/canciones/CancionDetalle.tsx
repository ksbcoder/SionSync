import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Plus, Presentation, Trash2 } from 'lucide-react';
import { supabase } from '../../infrastructure/supabase';
import { useCancionDetalle } from '../../hooks/useCancionDetalle';
import { useCanEdit } from '../../hooks/useRoles';
import { SeccionItem } from '../secciones/SeccionItem';
import { BottomSheet } from '../layout/BottomSheet';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { SwipeableCard } from '../ui/SwipeableCard';
import { SeccionForm } from '../secciones/SeccionForm';
import { DotLoader } from '../ui/DotLoader';

export function CancionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    cancion, loading, secciones,
    eliminarCancion, agregarSeccion, editarSeccion,
    eliminarSeccion, moverSeccion, duplicar,
    agregarNota, editarNota, eliminarNota,
  } = useCancionDetalle(id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [addSeccionOpen, setAddSeccionOpen] = useState(false);
  const [confirmCancion, setConfirmCancion] = useState(false);
  const [confirmSeccionId, setConfirmSeccionId] = useState<string | null>(null);
  const [detallesOpen, setDetallesOpen] = useState(false);
  const [creadorNombre, setCreadorNombre] = useState<string | null>(null);
  const canEdit = useCanEdit(cancion?.user_id);

  useEffect(() => {
    if (!cancion?.user_id) return;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', cancion.user_id)
      .single()
      .then(({ data }) => setCreadorNombre(data?.display_name ?? null));
  }, [cancion]);

  if (loading) {
    return <DotLoader text="Cargando canción..." />;
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
            actions={canEdit ? [{
              icon: <Trash2 className="w-5 h-5 text-white" />,
              bg: 'bg-red-500',
              onClick: () => setConfirmSeccionId(seccion.id),
            }] : []}
          >
            <SeccionItem
              seccion={seccion}
              canMoveUp={idx > 0}
              canMoveDown={idx < secciones.length - 1}
              onMoveUp={() => moverSeccion(seccion.id, 'arriba')}
              onMoveDown={() => moverSeccion(seccion.id, 'abajo')}
              onDelete={() => setConfirmSeccionId(seccion.id)}
              onDuplicate={() => duplicar(seccion.id)}
              onUpdate={(data) => editarSeccion(seccion.id, data)}
              onAddNota={(contenido) => agregarNota(seccion.id, contenido)}
              onUpdateNota={editarNota}
              onDeleteNota={eliminarNota}
            />
          </SwipeableCard>
        ))}
      </main>

      {canEdit && (
        <button
          onClick={() => setAddSeccionOpen(true)}
          className="md:hidden fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
          style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 0.75rem)' }}
          aria-label="Agregar sección"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones">
        <div className="flex flex-col gap-2">
          {canEdit && (
            <button onClick={() => { navigate(`/cancion/${id}/editar`); setMenuOpen(false); }}
              className="w-full h-12 text-left px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">
              Editar canción
            </button>
          )}
          <button onClick={() => { navigate(`/cancion/${id}/presentacion`); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-brand-100 text-brand-700 font-medium">
            Modo presentación
          </button>
          <button onClick={() => { setDetallesOpen(true); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">
            Detalles
          </button>
          {canEdit && (
            <button onClick={() => { setConfirmCancion(true); setMenuOpen(false); }}
              className="w-full h-12 text-left px-4 rounded-xl hover:bg-red-50 text-red-500 font-medium">
              Eliminar canción
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={detallesOpen} onClose={() => setDetallesOpen(false)} title="Detalles">
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Creado por</p>
            <p className="text-gray-800 font-medium">{creadorNombre ?? 'Desconocido'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Fecha de creación</p>
            <p className="text-gray-800 font-medium">
              {cancion?.created_at ? new Date(cancion.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Última modificación</p>
            <p className="text-gray-800 font-medium">
              {cancion?.updated_at ? new Date(cancion.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={addSeccionOpen} onClose={() => setAddSeccionOpen(false)} title="Nueva Sección">
        <SeccionForm
          onGuardar={async (data) => { await agregarSeccion(data); setAddSeccionOpen(false); }}
          onCancelar={() => setAddSeccionOpen(false)}
        />
      </BottomSheet>

      <ConfirmSheet
        isOpen={confirmCancion}
        onClose={() => setConfirmCancion(false)}
        onConfirm={async () => { await eliminarCancion(); navigate('/canciones'); }}
        title="¿Eliminar esta canción?"
        description="Se eliminarán todas sus secciones y acordes. Esta acción no se puede deshacer."
      />

      <ConfirmSheet
        isOpen={!!confirmSeccionId}
        onClose={() => setConfirmSeccionId(null)}
        onConfirm={() => { if (confirmSeccionId) eliminarSeccion(confirmSeccionId); }}
        title="¿Eliminar esta sección?"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
