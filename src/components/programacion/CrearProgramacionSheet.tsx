import { useState, useEffect } from 'react';
import { BottomSheet } from '../layout/BottomSheet';
import { OrbeLoader } from '../ui/OrbeLoader';
import { useProgramaciones } from '../../hooks/useProgramaciones';
import { useToast } from '../../hooks/useToast';
import type { TipoProgramacion, Programacion } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programacionesExistentes: Programacion[];
  onCreada: (programacion: Programacion) => void;
}

export function CrearProgramacionSheet({ isOpen, onClose, programacionesExistentes, onCreada }: Props) {
  const { getTipos, createProgramacion, loading } = useProgramaciones();
  const { showToast } = useToast();
  const [tipos, setTipos] = useState<TipoProgramacion[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingTipos(true);
    getTipos().then(data => setTipos(data ?? [])).finally(() => setLoadingTipos(false));
  }, [isOpen, getTipos]);

  const tiposUsados = new Set(programacionesExistentes.map(p => p.tipo_id));
  const tiposDisponibles = tipos.filter(t => !tiposUsados.has(t.id));

  const handleCrear = async (tipoId: string) => {
    const created = await createProgramacion({ tipo_id: tipoId });
    if (created) {
      onCreada(created);
      onClose();
      showToast('Programación creada', 'success');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Nueva programación">
      <div className="flex flex-col gap-2">
        {loadingTipos ? (
          <OrbeLoader text="Cargando tipos..." />
        ) : tiposDisponibles.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Ya existen programaciones para todos los tipos</p>
        ) : (
          tiposDisponibles.map(tipo => (
            <button
              key={tipo.id}
              onClick={() => handleCrear(tipo.id)}
              disabled={loading}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-gray-800">{tipo.nombre}</span>
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  );
}
