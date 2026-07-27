import { useState, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';
import { BottomSheet } from '../layout/BottomSheet';
import { OrbeLoader } from '../ui/OrbeLoader';
import { useResponsables } from '../../hooks/useProgramaciones';
import { useToast } from '../../hooks/useToast';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import { responsableRepository } from '../../infrastructure/programacion.repository';
import { formatFecha } from '../../domain';
import type { Programacion, ResponsableProgramacion, UsuarioConRol } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  programacion: Programacion | null;
  fechaInicial: string;
  onAsignado: (cambios: { agregados: ResponsableProgramacion[]; quitadosIds: string[] }) => void;
}

export function AsignarResponsableSheet({ isOpen, onClose, programacion, fechaInicial, onAsignado }: Props) {
  const { asignarVarios, eliminarResponsable, loading: saving } = useResponsables();
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [existentes, setExistentes] = useState<ResponsableProgramacion[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingExistentes, setLoadingExistentes] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingUsuarios(true);
    usuarioRepository.getAll()
      .then(data => setUsuarios(data.filter(u => u.active)))
      .finally(() => setLoadingUsuarios(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !programacion) return;
    // Cancelamos la consulta anterior: si cambia la fecha (o se cierra) antes
    // de que responda, ignoramos ese resultado para que una respuesta vieja no
    // pise los responsables de la fecha actual.
    let cancelado = false;
    setLoadingExistentes(true);
    responsableRepository.getByProgramacionYFecha(programacion.id, fechaInicial)
      .then(data => {
        if (cancelado) return;
        setExistentes(data);
        setSeleccionados(new Set(data.map(r => r.user_id)));
      })
      .catch(() => {
        if (cancelado) return;
        setExistentes([]);
        setSeleccionados(new Set());
      })
      .finally(() => {
        if (!cancelado) setLoadingExistentes(false);
      });
    return () => { cancelado = true; };
  }, [isOpen, programacion, fechaInicial]);

  const toggleUsuario = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const idsExistentes = new Set(existentes.map(r => r.user_id));
  const aAgregar = Array.from(seleccionados).filter(id => !idsExistentes.has(id));
  const aQuitar = existentes.filter(r => !seleccionados.has(r.user_id));
  const hayCambios = aAgregar.length > 0 || aQuitar.length > 0;

  const handleGuardar = async () => {
    if (!programacion || !hayCambios) return;

    let ok = true;
    let agregados: ResponsableProgramacion[] = [];
    if (aAgregar.length > 0) {
      const inserts = aAgregar.map(user_id => ({
        programacion_id: programacion.id,
        user_id,
        fecha: fechaInicial,
      }));
      const result = await asignarVarios(inserts);
      if (result) agregados = result;
      else ok = false;
    }

    const quitadosIds: string[] = [];
    if (ok && aQuitar.length > 0) {
      for (const resp of aQuitar) {
        const eliminado = await eliminarResponsable(resp.id);
        if (!eliminado) { ok = false; break; }
        quitadosIds.push(resp.id);
      }
    }

    if (!ok) return;

    // El padre refleja estos cambios en la semana sin recargar.
    onAsignado({ agregados, quitadosIds });
    onClose();

    const partes: string[] = [];
    if (aAgregar.length > 0) partes.push(`${aAgregar.length} asignado${aAgregar.length === 1 ? '' : 's'}`);
    if (aQuitar.length > 0) partes.push(`${aQuitar.length} quitado${aQuitar.length === 1 ? '' : 's'}`);
    showToast(partes.join(', '), 'success');
  };

  const loading = loadingUsuarios || loadingExistentes;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Responsables de ${programacion?.tipos_programacion?.nombre ?? 'programación'}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-gray-500 block mb-1">Fecha de responsabilidad</label>
          <div className="flex items-center gap-2 h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="capitalize">{formatFecha(fechaInicial)}</span>
          </div>
        </div>

        {loading ? (
          <OrbeLoader text="Cargando..." />
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay usuarios activos</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto">
            {usuarios.map(usuario => {
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
          disabled={saving || !hayCambios || !fechaInicial}
          className="w-full min-h-[44px] rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : hayCambios ? 'Guardar cambios' : 'Sin cambios'}
        </button>
      </div>
    </BottomSheet>
  );
}
