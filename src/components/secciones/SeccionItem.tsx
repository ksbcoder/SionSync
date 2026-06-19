import { useState } from 'react';
import { MoreVertical, ChevronUp, ChevronDown, Trash2, Pencil, Music, Copy } from 'lucide-react';
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
  onUpdate: (data: { tipo: TipoSeccion; letra: string }) => Promise<void>;
  onAddNota: (contenido: string) => Promise<void>;
  onUpdateNota: (id: string, contenido: string) => Promise<void>;
  onDeleteNota: (id: string) => Promise<void>;
}

const menuItemBase = 'w-full min-h-[48px] flex items-center gap-3 px-4 rounded-xl text-sm font-medium transition-colors';

export function SeccionItem({
  seccion, canEdit, canMoveUp, canMoveDown,
  onMoveUp, onMoveDown, onDelete, onDuplicate, onUpdate,
  onAddNota, onUpdateNota, onDeleteNota,
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <SeccionBadge tipo={seccion.tipo} />
              {notas.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <NotasDisplay notas={notas} />
                  </div>
                </>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => setNotasOpen(true)}
                  title="Acordes / Notas"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-chord-dark hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Music className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { onDuplicate(); }}
                  title="Duplicar"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMenuOpen(true)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">{seccion.letra}</p>
        </div>
      </div>

      <BottomSheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Opciones de sección">
        <div className="flex flex-col gap-1">
          <button onClick={() => closeAndRun(() => setEditOpen(true))} className={`${menuItemBase} text-gray-700 hover:bg-gray-50`}>
            <Pencil className="w-5 h-5 text-brand-500" />
            Editar sección
          </button>
          <button onClick={() => closeAndRun(onMoveUp)} disabled={!canMoveUp} className={`${menuItemBase} text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none`}>
            <ChevronUp className="w-5 h-5 text-gray-500" />
            Mover arriba
          </button>
          <button onClick={() => closeAndRun(onMoveDown)} disabled={!canMoveDown} className={`${menuItemBase} text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none`}>
            <ChevronDown className="w-5 h-5 text-gray-500" />
            Mover abajo
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
