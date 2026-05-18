import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Pencil, Music, Copy } from 'lucide-react';
import { SeccionBadge } from './SeccionBadge';
import { NotasDisplay } from '../notas/NotasDisplay';
import { BottomSheet } from '../layout/BottomSheet';
import { SeccionForm } from './SeccionForm';
import { NotasForm } from '../notas/NotasForm';
import type { Seccion, TipoSeccion, Nota } from '../../types';

interface SeccionItemProps {
  seccion: Seccion;
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

const iconBtn = 'min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg transition-colors disabled:opacity-20';

export function SeccionItem({
  seccion, canMoveUp, canMoveDown,
  onMoveUp, onMoveDown, onDelete, onDuplicate, onUpdate,
  onAddNota, onUpdateNota, onDeleteNota,
}: SeccionItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [notasOpen, setNotasOpen] = useState(false);
  const notas: Nota[] = seccion.notas ?? [];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <SeccionBadge tipo={seccion.tipo} />
            <div className="flex gap-0.5">
              <button onClick={() => setNotasOpen(true)} className={iconBtn} title="Acordes">
                <Music className="w-4 h-4" />
              </button>
              <button onClick={() => setEditOpen(true)} className={iconBtn} title="Editar">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={onMoveUp} disabled={!canMoveUp} className={iconBtn} title="Subir">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={onMoveDown} disabled={!canMoveDown} className={iconBtn} title="Bajar">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={onDuplicate} className={iconBtn} title="Duplicar">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={onDelete} className={`${iconBtn} hover:text-red-500`} title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <NotasDisplay notas={notas} />
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">{seccion.letra}</p>
        </div>
      </div>

      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar sección">
        <SeccionForm
          cancionId={seccion.cancion_id}
          seccion={seccion}
          ordenSiguiente={seccion.orden}
          onGuardar={async (data) => { await onUpdate(data); setEditOpen(false); }}
          onCancelar={() => setEditOpen(false)}
        />
      </BottomSheet>

      <BottomSheet isOpen={notasOpen} onClose={() => setNotasOpen(false)} title="Acordes / Notas">
        <NotasForm
          notas={notas}
          onAdd={onAddNota}
          onUpdate={onUpdateNota}
          onDelete={onDeleteNota}
        />
      </BottomSheet>
    </>
  );
}
