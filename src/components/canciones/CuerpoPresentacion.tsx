import { SeccionBadge } from '../secciones/SeccionBadge';
import { NotasDisplay } from '../notas/NotasDisplay';
import type { Cancion } from '../../domain';

/**
 * Cuerpo visual de una canción en modo presentación: sus secciones en orden,
 * con los acordes y la letra grande. Lo comparten la presentación de una sola
 * canción y la de una sesión completa.
 */
export function CuerpoPresentacion({ cancion }: { cancion: Cancion }) {
  const secciones = [...(cancion.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {secciones.map(seccion => (
        <div key={seccion.id}>
          <div className="mb-3">
            <SeccionBadge tipo={seccion.tipo} />
          </div>
          {seccion.notas && seccion.notas.length > 0 && (
            <NotasDisplay notas={seccion.notas} presentacion />
          )}
          <p className="text-xl leading-loose text-stage-text whitespace-pre-wrap">{seccion.letra}</p>
        </div>
      ))}
    </div>
  );
}
