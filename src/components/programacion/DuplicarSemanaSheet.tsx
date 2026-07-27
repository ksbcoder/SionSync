import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, CalendarRange } from 'lucide-react';
import { BottomSheet } from '../layout/BottomSheet';
import { OrbePensante } from '../ui/OrbePensante';
import { useResponsables } from '../../hooks/useProgramaciones';
import { useToast } from '../../hooks/useToast';
import { formatFecha, sumarDias } from '../../domain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Lunes de la semana que se va a copiar (origen). */
  semanaOrigenInicio: string;
  /** Cuántas asignaciones de servicios activos tiene la semana origen. */
  cantidadAsignaciones: number;
  /** Ids de las programaciones activas: solo se copian responsables de estas. */
  programacionIdsActivas: string[];
  /** Se llama tras duplicar para que la pantalla recargue. */
  onDuplicado: () => void;
}

/** Texto del rango de una semana a partir de su lunes, p. ej. "lun, 16 jun – dom, 22 jun". */
function rangoSemana(inicio: string): string {
  return `${formatFecha(inicio)} – ${formatFecha(sumarDias(inicio, 6))}`;
}

export function DuplicarSemanaSheet({
  isOpen,
  onClose,
  semanaOrigenInicio,
  cantidadAsignaciones,
  programacionIdsActivas,
  onDuplicado,
}: Props) {
  const { copiarSemana, loading: copiando } = useResponsables();
  const { showToast } = useToast();
  // La semana destino arranca en la siguiente a la de origen.
  const [destinoInicio, setDestinoInicio] = useState(() => sumarDias(semanaOrigenInicio, 7));

  // Al abrir (o si cambia el origen), reiniciamos el destino a la semana siguiente.
  useEffect(() => {
    if (isOpen) setDestinoInicio(sumarDias(semanaOrigenInicio, 7));
  }, [isOpen, semanaOrigenInicio]);

  const esMismaSemana = destinoInicio === semanaOrigenInicio;
  const sinAsignaciones = cantidadAsignaciones === 0;
  const puedeDuplicar = !esMismaSemana && !sinAsignaciones && !copiando;

  const handleDuplicar = async () => {
    if (!puedeDuplicar) return;
    const resultado = await copiarSemana(semanaOrigenInicio, destinoInicio, programacionIdsActivas);
    if (!resultado) return;

    const { copiados, omitidos } = resultado;
    if (copiados === 0) {
      showToast('No había nada nuevo que copiar: ya estaban todas las asignaciones', 'success');
    } else {
      const base = `${copiados} asignación${copiados === 1 ? '' : 'es'} copiada${copiados === 1 ? '' : 's'}`;
      showToast(omitidos > 0 ? `${base}, ${omitidos} ya existían` : base, 'success');
    }
    onDuplicado();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Duplicar semana">
      <div className="flex flex-col gap-4">
        {/* Resumen de la semana que se copia */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Semana que se copia</p>
          <p className="text-sm font-medium text-gray-800 capitalize">{rangoSemana(semanaOrigenInicio)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {sinAsignaciones
              ? 'No hay responsables asignados en esta semana'
              : `${cantidadAsignaciones} asignación${cantidadAsignaciones === 1 ? '' : 'es'} de responsables`}
          </p>
        </div>

        {/* Selector de la semana destino */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Copiar a la semana</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDestinoInicio(d => sumarDias(d, -7))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center justify-center gap-2 h-11 px-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-medium text-brand-800">
              <CalendarRange className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="capitalize text-center">{rangoSemana(destinoInicio)}</span>
            </div>
            <button
              onClick={() => setDestinoInicio(d => sumarDias(d, 7))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {esMismaSemana && (
            <p className="text-xs text-warning mt-1.5">Elige una semana distinta a la que estás copiando.</p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Se copian las personas asignadas conservando su día de la semana. No se reemplaza lo que ya
          haya en la semana destino: las asignaciones repetidas se omiten.
        </p>

        <button
          onClick={handleDuplicar}
          disabled={!puedeDuplicar}
          className="w-full min-h-[44px] rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {copiando ? (
            <OrbePensante state="working" size={20} tono="sobre-indigo" label="Duplicando..." />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copiando ? 'Duplicando...' : 'Duplicar semana'}
        </button>
      </div>
    </BottomSheet>
  );
}
