import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Presentation, MoreVertical, ChevronUp, ChevronDown, Trash2, Music2 } from 'lucide-react';
import { useSesionDetalle } from '../../hooks/useSesionDetalle';
import { useSesiones } from '../../hooks/useSesiones';
import { useRealtime } from '../../hooks/useRealtime';
import { useRecargarAlVolver } from '../../hooks/useRecargarAlVolver';
import { useCanEdit } from '../../hooks/useRoles';
import { useToast } from '../../hooks/useToast';
import { BottomSheet } from '../layout/BottomSheet';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { EmptyState } from '../ui/EmptyState';
import { OrbeLoader } from '../ui/OrbeLoader';
import { SesionFormSheet } from './SesionFormSheet';
import { AgregarCancionesSheet } from './AgregarCancionesSheet';
import { formatFecha } from '../../domain';

export function SesionDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sesion, loading, canciones, cargar, agregarCanciones, actualizarDatos, quitar, mover } = useSesionDetalle(id);
  const { deleteSesion } = useSesiones();
  const { showToast } = useToast();
  const canEdit = useCanEdit(sesion?.user_id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [confirmSesion, setConfirmSesion] = useState(false);
  const [confirmQuitar, setConfirmQuitar] = useState<string | null>(null);

  // Mantiene el detalle al día si cambia en otro dispositivo o al volver de
  // crear una canción nueva (que la agrega a esta sesión).
  useRealtime(['sesiones', 'sesion_canciones', 'canciones'], cargar);
  useRecargarAlVolver(cargar);

  if (loading && !sesion) return <OrbeLoader text="Cargando sesión..." />;

  if (!sesion) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-500">Sesión no encontrada</p>
        <button
          onClick={() => navigate('/canciones/sesiones')}
          className="min-h-[44px] px-6 bg-brand-100 text-brand-900 rounded-lg font-medium text-sm hover:opacity-90"
        >
          Volver a sesiones
        </button>
      </div>
    );
  }

  const idsEnSesion = new Set(canciones.map(c => c.cancion_id));

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/canciones/sesiones')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-800 truncate">{sesion.nombre}</h1>
          {sesion.fecha && <p className="text-xs text-gray-400 capitalize">{formatFecha(sesion.fecha)}</p>}
        </div>
        {canciones.length > 0 && (
          <button
            onClick={() => navigate(`/sesion/${id}/presentacion`)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl"
            title="Modo presentación"
          >
            <Presentation className="w-5 h-5" />
          </button>
        )}
        {canEdit && (
          <button onClick={() => setMenuOpen(true)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl">
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="px-4 py-4 flex flex-col gap-2 max-w-2xl mx-auto">
        {canciones.length === 0 ? (
          <EmptyState
            title="Sesión vacía"
            description={canEdit ? 'Agrega canciones del catálogo o crea una nueva' : 'Aún no tiene canciones'}
          />
        ) : (
          canciones.map((sc, idx) => (
            <div key={sc.id} className="bg-white rounded-xl border border-gray-100 flex items-center gap-2 pr-2">
              <button
                className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left active:bg-indigo-50 rounded-l-xl"
                onClick={() => navigate(`/cancion/${sc.cancion_id}?sesion=${id}`)}
              >
                <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                  {idx + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800 truncate">
                    {sc.canciones?.titulo ?? 'Canción'}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    {sc.canciones?.autor && <span className="truncate">{sc.canciones.autor}</span>}
                    {sc.canciones?.tonalidad && (
                      <span className="bg-brand-100 text-brand-900 px-1.5 rounded-full font-medium shrink-0">
                        {sc.canciones.tonalidad}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              {canEdit && (
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => mover(sc.id, 'arriba')}
                    disabled={idx === 0}
                    className="min-h-[40px] min-w-[32px] flex items-center justify-center text-gray-400 hover:text-brand-700 disabled:opacity-25"
                    aria-label="Subir"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => mover(sc.id, 'abajo')}
                    disabled={idx === canciones.length - 1}
                    className="min-h-[40px] min-w-[32px] flex items-center justify-center text-gray-400 hover:text-brand-700 disabled:opacity-25"
                    aria-label="Bajar"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setConfirmQuitar(sc.id)}
                    className="min-h-[40px] min-w-[32px] flex items-center justify-center text-gray-300 hover:text-danger"
                    aria-label="Quitar de la sesión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {canEdit && (
        <button
          onClick={() => setAgregarOpen(true)}
          className="fixed right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          aria-label="Agregar canciones"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setEditarOpen(true); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-3"
          >
            <Music2 className="w-5 h-5 text-brand-700" /> Editar nombre y fecha
          </button>
          <button
            onClick={() => { setConfirmSesion(true); setMenuOpen(false); }}
            className="w-full h-12 text-left px-4 rounded-xl hover:bg-red-50 text-red-500 font-medium flex items-center gap-3"
          >
            <Trash2 className="w-5 h-5" /> Eliminar sesión
          </button>
        </div>
      </BottomSheet>

      <SesionFormSheet
        isOpen={editarOpen}
        onClose={() => setEditarOpen(false)}
        sesionExistente={sesion}
        onGuardado={actualizarDatos}
      />

      <AgregarCancionesSheet
        isOpen={agregarOpen}
        onClose={() => setAgregarOpen(false)}
        sesionId={sesion.id}
        idsEnSesion={idsEnSesion}
        onAgregar={agregarCanciones}
      />

      <ConfirmSheet
        isOpen={confirmSesion}
        onClose={() => setConfirmSesion(false)}
        onConfirm={async () => {
          const ok = await deleteSesion(sesion.id);
          if (ok) { showToast('Sesión eliminada', 'success'); navigate('/canciones/sesiones'); }
        }}
        title="¿Eliminar esta sesión?"
        description="Se eliminará la sesión y su lista de canciones. Las canciones seguirán en el catálogo."
      />

      <ConfirmSheet
        isOpen={!!confirmQuitar}
        onClose={() => setConfirmQuitar(null)}
        onConfirm={async () => {
          if (!confirmQuitar) return;
          await quitar(confirmQuitar);
          showToast('Canción quitada de la sesión', 'success');
        }}
        title="¿Quitar de la sesión?"
        description="La canción se quita de esta sesión, pero sigue en el catálogo."
      />
    </div>
  );
}
