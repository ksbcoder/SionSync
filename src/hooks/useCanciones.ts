import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { cancionRepository } from '../infrastructure/cancion.repository';
import type { Cancion, CancionInsert } from '../domain';

export function useCanciones() {
  const { loading, error, run, runVoid } = useAsync();

  const getCanciones = useCallback(
    (): Promise<Cancion[] | null> => run(() => cancionRepository.getAll()),
    [run]
  );

  const getCancion = useCallback(
    (id: string): Promise<Cancion | null> => run(() => cancionRepository.getById(id)),
    [run]
  );

  const createCancion = useCallback(
    (data: CancionInsert): Promise<Cancion | null> => run(() => cancionRepository.create(data)),
    [run]
  );

  const updateCancion = useCallback(
    (id: string, data: Partial<CancionInsert>): Promise<Cancion | null> => run(() => cancionRepository.update(id, data)),
    [run]
  );

  const deleteCancion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => cancionRepository.delete(id)),
    [runVoid]
  );

  const buscarCanciones = useCallback(
    (query: string): Promise<Cancion[] | null> => run(() => cancionRepository.buscar(query)),
    [run]
  );

  return { loading, error, getCanciones, getCancion, createCancion, updateCancion, deleteCancion, buscarCanciones };
}
