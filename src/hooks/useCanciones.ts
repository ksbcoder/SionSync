import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { cancionService } from '../application/cancion.service';
import type { Cancion, CancionInsert } from '../domain';

export function useCanciones() {
  const { loading, error, run, runVoid } = useAsync();

  const getCanciones = useCallback(
    (): Promise<Cancion[] | null> => run(() => cancionService.getAll()),
    [run]
  );

  const getCancion = useCallback(
    (id: string): Promise<Cancion | null> => run(() => cancionService.getById(id)),
    [run]
  );

  const createCancion = useCallback(
    (data: CancionInsert): Promise<Cancion | null> => run(() => cancionService.create(data)),
    [run]
  );

  const updateCancion = useCallback(
    (id: string, data: Partial<CancionInsert>): Promise<Cancion | null> => run(() => cancionService.update(id, data)),
    [run]
  );

  const deleteCancion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => cancionService.delete(id)),
    [runVoid]
  );

  const buscarCanciones = useCallback(
    (query: string): Promise<Cancion[] | null> => run(() => cancionService.buscar(query)),
    [run]
  );

  return { loading, error, getCanciones, getCancion, createCancion, updateCancion, deleteCancion, buscarCanciones };
}
