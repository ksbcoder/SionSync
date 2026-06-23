import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { seccionRepository } from '../infrastructure/seccion.repository';
import { notaRepository } from '../infrastructure/nota.repository';
import type { Seccion, SeccionInsert } from '../domain';

export function useSecciones() {
  const { loading, error, run, runVoid } = useAsync();

  const addSeccion = useCallback(
    (data: SeccionInsert): Promise<Seccion | null> => run(() => seccionRepository.create(data)),
    [run]
  );

  const updateSeccion = useCallback(
    (id: string, data: Partial<Pick<SeccionInsert, 'tipo' | 'letra' | 'descripcion' | 'grupo_simultaneo'>>): Promise<Seccion | null> =>
      run(() => seccionRepository.update(id, data)),
    [run]
  );

  const addSecciones = useCallback(
    (secciones: SeccionInsert[]): Promise<boolean> => runVoid(() => seccionRepository.createMany(secciones)),
    [runVoid]
  );

  const deleteSeccion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => seccionRepository.delete(id)),
    [runVoid]
  );

  const reordenarSecciones = useCallback(
    (ordenes: { id: string; orden: number }[]): Promise<boolean> =>
      runVoid(() => seccionRepository.updateOrden(ordenes)),
    [runVoid]
  );

  const duplicarSeccion = useCallback(
    (seccion: Seccion, ordenSiguiente: number): Promise<Seccion | null> =>
      run(async () => {
        const nueva = await seccionRepository.create({
          cancion_id: seccion.cancion_id,
          tipo: seccion.tipo,
          letra: seccion.letra,
          descripcion: seccion.descripcion,
          orden: ordenSiguiente,
        });

        if (seccion.notas?.length) {
          await notaRepository.createMany(
            seccion.notas.map(n => ({
              seccion_id: nueva.id,
              orden: n.orden,
              contenido: n.contenido,
            }))
          );
        }

        return nueva;
      }),
    [run]
  );

  return { loading, error, addSeccion, addSecciones, updateSeccion, deleteSeccion, reordenarSecciones, duplicarSeccion };
}
