import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../layout/BottomSheet';
import { DotLoader } from '../ui/DotLoader';
import { useResponsables } from '../../hooks/useProgramaciones';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import type { Programacion, ResponsableProgramacion, UsuarioConRol } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programacion: Programacion | null;
  fechaInicial: string;
  responsablesExistentes: ResponsableProgramacion[];
  onAsignado: () => void;
}

export function AsignarResponsableSheet({ isOpen, onClose, programacion, fechaInicial, responsablesExistentes, onAsignado }: Props) {
  const { asignarVarios, loading: saving } = useResponsables();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [fecha, setFecha] = useState(fechaInicial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSeleccionados(new Set());
    setFecha(fechaInicial);
    setLoading(true);
    usuarioRepository.getAll().then(data => {
      setUsuarios(data.filter(u => u.active));
    }).finally(() => setLoading(false));
  }, [isOpen, fechaInicial]);

  const fechaCambiada = fecha !== fechaInicial;
  const idsYaAsignados = fechaCambiada ? new Set<string>() : new Set(responsablesExistentes.map(r => r.user_id));

  const toggleUsuario = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGuardar = async () => {
    if (!programacion || seleccionados.size === 0) return;
    const inserts = Array.from(seleccionados).map(user_id => ({
      programacion_id: programacion.id,
      user_id,
      fecha,
    }));
    await asignarVarios(inserts);
    onAsignado();
    onClose();
  };

  const disponibles = usuarios.filter(u => !idsYaAsignados.has(u.id));

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignar a ${programacion?.tipos_programacion?.nombre ?? 'Programación'}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-gray-500 block mb-1">Fecha de responsabilidad</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {loading ? (
          <DotLoader text="Cargando usuarios..." />
        ) : disponibles.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Todos los usuarios ya están asignados</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
            {disponibles.map(usuario => {
              const selected = seleccionados.has(usuario.id);
              return (
                <button
                  key={usuario.id}
                  onClick={() => toggleUsuario(usuario.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center justify-between ${
                    selected
                      ? 'bg-brand-50 border-2 border-brand-300'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800">{usuario.display_name}</span>
                  {selected && <Check className="w-5 h-5 text-brand-700" />}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={handleGuardar}
          disabled={saving || seleccionados.size === 0 || !fecha}
          className="w-full min-h-[44px] rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : `Asignar (${seleccionados.size})`}
        </button>
      </div>
    </BottomSheet>
  );
}
