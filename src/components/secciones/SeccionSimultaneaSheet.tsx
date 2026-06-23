import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../layout/BottomSheet';
import { SeccionBadge } from './SeccionBadge';
import { TouchButton } from '../ui/TouchButton';
import type { Seccion } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Sección desde la que se configura (la "actual"). */
  seccion: Seccion;
  /** Todas las secciones de la canción (incluida la actual). */
  secciones: Seccion[];
  /** Guarda los ids de las secciones que se cantan a la vez que la actual. */
  onGuardar: (idsSeleccionadas: string[]) => Promise<void>;
}

// Primera línea de la letra, como pista para identificar la sección.
function primeraLinea(letra: string): string {
  return letra.split('\n').find(l => l.trim()) ?? '';
}

export function SeccionSimultaneaSheet({ isOpen, onClose, seccion, secciones, onGuardar }: Props) {
  const otras = secciones.filter(s => s.id !== seccion.id);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);

  // Al abrir: precargar las secciones que ya están en el mismo grupo.
  useEffect(() => {
    if (!isOpen) return;
    const grupo = seccion.grupo_simultaneo;
    setSeleccion(new Set(
      grupo ? otras.filter(s => s.grupo_simultaneo === grupo).map(s => s.id) : []
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, seccion.id]);

  const toggle = (id: string) => {
    setSeleccion(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar(Array.from(seleccion));
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Cantar al mismo tiempo">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">
          Marca las secciones que se cantan a la vez que esta. Quedarán enlazadas como un grupo.
        </p>

        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
          <SeccionBadge tipo={seccion.tipo} />
          <span className="text-sm text-gray-500 truncate">{primeraLinea(seccion.letra)}</span>
        </div>

        {otras.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay otras secciones para enlazar.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto">
            {otras.map(s => {
              const selected = seleccion.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                    selected ? 'bg-brand-50 border-2 border-brand-300' : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <SeccionBadge tipo={s.tipo} />
                    <span className="text-sm text-gray-600 truncate">{primeraLinea(s.letra)}</span>
                  </span>
                  {selected && <Check className="w-5 h-5 text-brand-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <TouchButton variant="primary" fullWidth onClick={handleGuardar} disabled={guardando || otras.length === 0}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </TouchButton>
      </div>
    </BottomSheet>
  );
}
