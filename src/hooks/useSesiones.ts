import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { sesionRepository } from '../infrastructure/sesion.repository';
import type { Sesion, SesionConCanciones, SesionInsert } from '../domain';

export function useSesiones() {
  const { loading, error, run, runVoid } = useAsync();

  const getSesiones = useCallback(
    (): Promise<Sesion[] | null> => run(() => sesionRepository.getAll()),
    [run]
  );

  const getSesion = useCallback(
    (id: string): Promise<SesionConCanciones | null> => run(() => sesionRepository.getById(id)),
    [run]
  );

  const createSesion = useCallback(
    (data: SesionInsert): Promise<Sesion | null> => run(() => sesionRepository.create(data)),
    [run]
  );

  const updateSesion = useCallback(
    (id: string, data: Partial<SesionInsert>): Promise<Sesion | null> =>
      run(() => sesionRepository.update(id, data)),
    [run]
  );

  const deleteSesion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => sesionRepository.delete(id)),
    [runVoid]
  );

  const agregarCancion = useCallback(
    (sesionId: string, cancionId: string, orden: number): Promise<boolean> =>
      runVoid(() => sesionRepository.agregarCancion(sesionId, cancionId, orden)),
    [runVoid]
  );

  const agregarVarias = useCallback(
    (sesionId: string, items: { cancionId: string; orden: number }[]): Promise<boolean> =>
      runVoid(() => sesionRepository.agregarVarias(sesionId, items)),
    [runVoid]
  );

  const quitarCancion = useCallback(
    (sesionCancionId: string): Promise<boolean> => runVoid(() => sesionRepository.quitarCancion(sesionCancionId)),
    [runVoid]
  );

  const reordenar = useCallback(
    (ordenes: { id: string; orden: number }[]): Promise<boolean> => runVoid(() => sesionRepository.reordenar(ordenes)),
    [runVoid]
  );

  return {
    loading,
    error,
    getSesiones,
    getSesion,
    createSesion,
    updateSesion,
    deleteSesion,
    agregarCancion,
    agregarVarias,
    quitarCancion,
    reordenar,
  };
}
