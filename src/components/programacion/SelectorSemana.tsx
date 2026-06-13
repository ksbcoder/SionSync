import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hoy, sumarDias } from '../../domain';

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Calendario compacto de una semana: muestra los siete días, resalta el día
 * seleccionado y pinta un punto de color por cada tipo de servicio que tiene
 * responsables ese día. Permite saltar a la semana anterior/siguiente y volver
 * a hoy.
 */
export function SelectorSemana({
  fecha,
  diasSemana,
  coloresPorFecha,
  onSeleccionar,
}: {
  fecha: string;
  diasSemana: string[];
  coloresPorFecha: Map<string, string[]>;
  onSeleccionar: (fecha: string) => void;
}) {
  return (
    <div className="sticky top-[57px] bg-gray-50 px-4 pt-3 pb-2 z-10">
      <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSeleccionar(sumarDias(fecha, -7))}
            className="min-h-[40px] min-w-[36px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 grid grid-cols-7 gap-0.5">
            {diasSemana.map((dia, i) => {
              const d = new Date(dia + 'T12:00:00');
              const esSeleccionado = dia === fecha;
              const esHoy = dia === hoy();
              const colores = coloresPorFecha.get(dia) ?? [];
              return (
                <button
                  key={dia}
                  onClick={() => onSeleccionar(dia)}
                  className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                    esSeleccionado ? 'bg-stage-bg text-white' : 'hover:bg-brand-100 text-gray-700'
                  }`}
                >
                  <span className={`text-[10px] font-medium uppercase ${esSeleccionado ? 'text-white/70' : 'text-gray-400'}`}>
                    {LETRAS_DIA[i]}
                  </span>
                  <span className={`text-sm font-semibold ${esHoy && !esSeleccionado ? 'text-brand-700' : ''}`}>
                    {d.getDate()}
                  </span>
                  <span className="flex items-center gap-0.5 mt-1 h-1.5">
                    {colores.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onSeleccionar(sumarDias(fecha, 7))}
            className="min-h-[40px] min-w-[36px] flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {fecha !== hoy() && (
          <button
            onClick={() => onSeleccionar(hoy())}
            className="block w-full text-center text-xs text-brand-500 mt-1.5"
          >
            Volver a hoy
          </button>
        )}
      </div>
    </div>
  );
}
