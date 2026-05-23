import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { seccionService } from '../application/seccion.service';
import type { Seccion, SeccionInsert } from '../domain';

export function useSecciones() {
  const { loading, error, run, runVoid } = useAsync();

  const addSeccion = useCallback(
    (data: SeccionInsert): Promise<Seccion | null> => run(() => seccionService.create(data)),
    [run]
  );

  const updateSeccion = useCallback(
    (id: string, data: Partial<Pick<SeccionInsert, 'tipo' | 'letra'>>): Promise<Seccion | null> =>
      run(() => seccionService.update(id, data)),
    [run]
  );

  const deleteSeccion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => seccionService.delete(id)),
    [runVoid]
  );

  const reordenarSecciones = useCallback(
    (ordenes: { id: string; orden: number }[]): Promise<boolean> =>
      runVoid(() => seccionService.reordenar(ordenes)),
    [runVoid]
  );

  const duplicarSeccion = useCallback(
    (seccion: Seccion, ordenSiguiente: number): Promise<Seccion | null> =>
      run(() => seccionService.duplicar(seccion, ordenSiguiente)),
    [run]
  );

  return { loading, error, addSeccion, updateSeccion, deleteSeccion, reordenarSecciones, duplicarSeccion };
}
