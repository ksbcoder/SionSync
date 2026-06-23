import { Users } from 'lucide-react';
import { SeccionBadge } from '../secciones/SeccionBadge';
import { NotasDisplay } from '../notas/NotasDisplay';
import type { Cancion, Seccion } from '../../domain';

/**
 * Cuerpo visual de una canción en modo presentación: sus secciones en orden,
 * con los acordes y la letra grande. Lo comparten la presentación de una sola
 * canción y la de una sesión completa.
 *
 * Las secciones que comparten 'grupo_simultaneo' (se cantan a la vez) se pintan
 * juntas dentro de un marco, en la posición de la primera del grupo.
 */
function SeccionContenido({ seccion }: { seccion: Seccion }) {
  return (
    <div>
      <div className="mb-3">
        <SeccionBadge tipo={seccion.tipo} />
      </div>
      {seccion.notas && seccion.notas.length > 0 && (
        <NotasDisplay notas={seccion.notas} presentacion />
      )}
      <p className="text-xl leading-loose text-stage-text whitespace-pre-wrap">{seccion.letra}</p>
      {seccion.descripcion && (
        <p className="mt-3 text-base text-stage-muted italic whitespace-pre-wrap">{seccion.descripcion}</p>
      )}
    </div>
  );
}

export function CuerpoPresentacion({ cancion }: { cancion: Cancion }) {
  const secciones = [...(cancion.secciones ?? [])].sort((a, b) => a.orden - b.orden);

  // Agrupar: cada grupo simultáneo se muestra una sola vez, en la posición de
  // su primera sección. Las secciones sueltas, tal cual.
  const gruposVistos = new Set<string>();
  type Item = { tipo: 'sola'; key: string; seccion: Seccion } | { tipo: 'grupo'; key: string; miembros: Seccion[] };
  const items: Item[] = [];
  for (const s of secciones) {
    if (s.grupo_simultaneo) {
      if (gruposVistos.has(s.grupo_simultaneo)) continue;
      gruposVistos.add(s.grupo_simultaneo);
      const miembros = secciones.filter(x => x.grupo_simultaneo === s.grupo_simultaneo);
      if (miembros.length > 1) {
        items.push({ tipo: 'grupo', key: s.grupo_simultaneo, miembros });
        continue;
      }
    }
    items.push({ tipo: 'sola', key: s.id, seccion: s });
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {items.map(item =>
        item.tipo === 'sola' ? (
          <SeccionContenido key={item.key} seccion={item.seccion} />
        ) : (
          <div key={item.key} className="rounded-2xl border border-violet-400/40 p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {item.miembros.map(s => (
                <SeccionContenido key={s.id} seccion={s} />
              ))}
            </div>
            <div className="shrink-0 inline-flex items-center justify-center rounded-full bg-violet-500/20 text-violet-200 p-2" title="Se cantan a la vez">
              <Users className="w-4 h-4 shrink-0" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
