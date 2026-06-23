import { useState } from 'react';
import { MoreVertical, ChevronUp, ChevronDown, Trash2, Pencil, Music, Copy, Users } from 'lucide-react';
import { SeccionBadge } from './SeccionBadge';
import { NotasDisplay } from '../notas/NotasDisplay';
import { BottomSheet } from '../layout/BottomSheet';
import { SeccionForm } from './SeccionForm';
import { NotasForm } from '../notas/NotasForm';
import type { Seccion, TipoSeccion, Nota } from '../../domain';

interface SeccionItemProps {
  seccion: Seccion;
  canEdit: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate: () => Promise<void>;
  onUpdate: (data: { tipo: TipoSeccion; letra: string; descripcion: string | null }) => Promise<void>;
  onAddNota: (contenido: string) => Promise<void>;
  onUpdateNota: (id: string, contenido: string) => Promise<void>;
  onDeleteNota: (id: string) => Promise<void>;
  /** Abre el selector de secciones simultáneas. */
  onSimultanea: () => void;
  /** Etiquetas de las otras secciones que se cantan a la vez que esta. */
  companeras: string[];
}

const menuItemBase = 'w-full min-h-[48px] flex items-center gap-3 px-4 rounded-xl text-sm font-medium transition-colors';

export function SeccionItem({
  seccion, canEdit, canMoveUp, canMoveDown,
  onMoveUp, onMoveDown, onDelete, onDuplicate, onUpdate,
  onAddNota, onUpdateNota, onDeleteNota,
  onSimultanea, companeras,
}: SeccionItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notasOpen, setNotasOpen] = useState(false);
  const notas: Nota[] = seccion.notas ?? [];

  const closeAndRun = (fn: () => void) => {
    setMenuOpen(false);
    setTimeout(fn, 150);
  };

  return (
    <>
      <div className={`bg-white rounded-xl border overflow-hidden ${companeras.length > 0 ? 'border-violet-300' : 'border-gray-200'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <SeccionBadge tipo={seccion.tipo} />
              {companeras.length > 0 && (
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-full bg-violet-100 text-violet-700 p-1"
                  title={`A la vez con: ${companeras.join(', ')}`}
                >
                  <Users className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center shrink-0">
                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  title="Mover arriba"
                  className="min-h-[44px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronUp className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  title="Mover abajo"
                  className="min-h-[44px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronDown className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => { onDuplicate(); }}
                  title="Duplicar"
                  className="min-h-[44px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => setMenuOpen(true)}
                  className="min-h-[44px] min-w-[36px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </div>
          {notas.length > 0 && (
            <div className="mb-3">
              <NotasDisplay notas={notas} />
            </div>
          )}
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">{seccion.letra}</p>
          {seccion.descripcion && (
            <p className="mt-3 text-sm text-gray-500 italic whitespace-pre-wrap">{seccion.descripcion}</p>
          )}
        </div>
      </div>

      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones de sección">
        <div className="flex flex-col gap-1">
          <button onClick={() => closeAndRun(() => setEditOpen(true))} className={`${menuItemBase} text-gray-700 hover:bg-gray-50`}>
            <Pencil className="w-5 h-5 text-brand-500" />
            Editar sección
          </button>
          <button onClick={() => closeAndRun(() => setNotasOpen(true))} className={`${menuItemBase} text-gray-700 hover:bg-gray-50`}>
            <Music className="w-5 h-5 text-chord-dark" />
            Acordes / Notas
          </button>
          <button onClick={() => closeAndRun(onSimultanea)} className={`${menuItemBase} text-gray-700 hover:bg-gray-50`}>
            <Users className="w-5 h-5 text-violet-500" />
            Cantar al mismo tiempo
          </button>
          <button onClick={() => closeAndRun(onDelete)} className={`${menuItemBase} text-red-500 hover:bg-red-50`}>
            <Trash2 className="w-5 h-5" />
            Eliminar
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar sección">
        <SeccionForm
          seccion={seccion}
          onGuardar={async (data) => { await onUpdate(data); setEditOpen(false); }}
          onCancelar={() => setEditOpen(false)}
        />
      </BottomSheet>

      <BottomSheet isOpen={notasOpen} onClose={() => setNotasOpen(false)} title="Acordes / Notas">
        <NotasForm
          notas={notas}
          canEdit={canEdit}
          onAdd={onAddNota}
          onUpdate={onUpdateNota}
          onDelete={onDeleteNota}
        />
      </BottomSheet>
    </>
  );
}
