import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { Nota } from '../../domain';

interface NotasFormProps {
  notas: Nota[];
  canEdit: boolean;
  onAdd: (contenido: string) => Promise<void>;
  onUpdate: (id: string, contenido: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const iconBtn = 'min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors';

/**
 * Pone en mayúscula la nota inicial de cada acorde, conservando el resto tal
 * como se escribió (así la 'm' de menor sigue en minúscula: 'am - f#m' → 'Am - F#m').
 * Capitaliza la primera letra de cada bloque sin importar el separador (espacio,
 * guion o coma), por lo que también funciona al pegar acordes pegados: 'am-f-c'
 * → 'Am-F-C'.
 */
function mayusculaNota(texto: string): string {
  return texto.replace(/(^|[\s\-—–,])([a-z])/g, (_, sep, letra) => sep + letra.toUpperCase());
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

  // Al pulsar espacio insertamos ' - ' (el separador entre acordes) en la
  // posición del cursor; con Enter se confirma. Lo comparten el campo de
  // agregar y el de editar, para que ambos se comporten igual.
  const handleAcordeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    valor: string,
    setValor: (v: string) => void,
    onEnter: () => void,
  ) => {
    if (e.key === ' ') {
      e.preventDefault();
      const input = e.currentTarget;
      const start = input.selectionStart ?? valor.length;
      const end = input.selectionEnd ?? valor.length;
      const insertion = ' - ';
      const newValue = valor.slice(0, start) + insertion + valor.slice(end);
      setValor(newValue);
      requestAnimationFrame(() => {
        input.setSelectionRange(start + insertion.length, start + insertion.length);
      });
    } else if (e.key === 'Enter') {
      onEnter();
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
                onChange={e => setEditValor(mayusculaNota(e.target.value))}
                onKeyDown={e => handleAcordeKeyDown(e, editValor, setEditValor, () => handleUpdate(nota.id))}
                autoFocus
              />
              <button onClick={() => handleUpdate(nota.id)} className={`${iconBtn} text-green-600 hover:bg-green-50`}>
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditando(null)} className={`${iconBtn} text-gray-400 hover:bg-gray-50`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : confirmando === nota.id ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm text-red-700">¿Eliminar este acorde?</span>
              <button
                onClick={async () => { await onDelete(nota.id); setConfirmando(null); }}
                className={`${iconBtn} text-red-600 hover:bg-red-100`}
              >
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setConfirmando(null)} className={`${iconBtn} text-gray-400 hover:bg-gray-100`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-sm text-chord-dark bg-chord-bg border border-emerald-100 px-3 py-2 rounded-lg">
                {nota.contenido}
              </span>
              {canEdit && (
                <>
                  <button onClick={() => startEdit(nota)} className={`${iconBtn} text-gray-400 hover:text-brand-700 hover:bg-brand-50`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmando(nota.id)} className={`${iconBtn} text-gray-400 hover:text-red-500 hover:bg-red-50`}>
                    <Trash2 className="w-4 h-4" />
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
            onChange={e => setNuevo(mayusculaNota(e.target.value))}
            onKeyDown={e => handleAcordeKeyDown(e, nuevo, setNuevo, handleAdd)}
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
