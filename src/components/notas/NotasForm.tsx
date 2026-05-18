import { useState } from 'react';
import type { Nota } from '../../types';

interface NotasFormProps {
  notas: Nota[];
  onAdd: (contenido: string) => Promise<void>;
  onUpdate: (id: string, contenido: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotasForm({ notas, onAdd, onUpdate, onDelete }: NotasFormProps) {
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');

  const handleAdd = async () => {
    if (!nuevo.trim()) return;
    await onAdd(nuevo.trim());
    setNuevo('');
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
              <button
                onClick={() => handleUpdate(nota.id)}
                className="min-h-[44px] px-3 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditando(null)}
                className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                {nota.contenido}
              </span>
              <button
                onClick={() => startEdit(nota)}
                className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-gray-700"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(nota.id)}
                className="min-h-[44px] px-2 text-sm text-gray-400 hover:text-red-500"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-gray-500"
          placeholder="Ej: Am - F - C - G"
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!nuevo.trim()}
          className="min-h-[44px] px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
