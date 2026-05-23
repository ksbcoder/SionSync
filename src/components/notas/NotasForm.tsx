import { useState } from 'react';
import type { Nota } from '../../domain';

interface NotasFormProps {
  notas: Nota[];
  canEdit: boolean;
  onAdd: (contenido: string) => Promise<void>;
  onUpdate: (id: string, contenido: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotasForm({ notas, canEdit, onAdd, onUpdate, onDelete }: NotasFormProps) {
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!nuevo.trim()) return;
    await onAdd(nuevo.trim());
    setNuevo('');
  };

  const handleNuevoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      const input = e.currentTarget;
      const start = input.selectionStart ?? nuevo.length;
      const end = input.selectionEnd ?? nuevo.length;
      const insertion = ' - ';
      const newValue = nuevo.slice(0, start) + insertion + nuevo.slice(end);
      setNuevo(newValue);
      requestAnimationFrame(() => {
        input.setSelectionRange(start + insertion.length, start + insertion.length);
      });
    } else if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const startEdit = (nota: Nota) => {
    setEditando(nota.id);
    setEditValor(nota.contenido);
  };

  const handleUpdate = async (id: string) => {
    if (!editValor.trim()) return;
    await onUpdate(id, editValor.trim());
    setEditando(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {notas.map(nota => (
        <div key={nota.id}>
          {editando === nota.id ? (
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-gray-500"
                value={editValor}
                onChange={e => setEditValor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdate(nota.id)}
                autoFocus
              />
              <button onClick={() => handleUpdate(nota.id)} className="min-h-[44px] px-3 text-sm font-medium text-gray-700 hover:text-gray-900">
                Guardar
              </button>
              <button onClick={() => setEditando(null)} className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-gray-600">
                Cancelar
              </button>
            </div>
          ) : confirmando === nota.id ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-red-700">¿Eliminar este acorde?</span>
              <button
                onClick={async () => { await onDelete(nota.id); setConfirmando(null); }}
                className="min-h-[44px] px-3 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Sí
              </button>
              <button onClick={() => setConfirmando(null)} className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-gray-600">
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-sm text-chord-dark bg-chord-bg border border-emerald-100 px-3 py-2 rounded-lg">
                {nota.contenido}
              </span>
              {canEdit && (
                <>
                  <button onClick={() => startEdit(nota)} className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-gray-700">
                    Editar
                  </button>
                  <button onClick={() => setConfirmando(nota.id)} className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-red-500">
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-gray-500"
            placeholder="Ej: Am - F - C - G"
            value={nuevo}
            onChange={e => setNuevo(e.target.value)}
            onKeyDown={handleNuevoKeyDown}
          />
          <button
            onClick={handleAdd}
            disabled={!nuevo.trim()}
            className="min-h-[44px] px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}
