import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { programacionRepository, responsableRepository } from '../infrastructure/programacion.repository';
import type { TipoProgramacion, Programacion, ProgramacionInsert, ResponsableProgramacion, ResponsableInsert } from '../domain';

export function useProgramaciones() {
  const { loading, error, run, runVoid } = useAsync();

  const getTipos = useCallback(
    (): Promise<TipoProgramacion[] | null> => run(() => programacionRepository.getTipos()),
    [run]
  );

  const getProgramaciones = useCallback(
    (): Promise<Programacion[] | null> => run(() => programacionRepository.getAll()),
    [run]
  );

  const getProgramacionesActivas = useCallback(
    (): Promise<Programacion[] | null> => run(() => programacionRepository.getActivas()),
    [run]
  );

  const createProgramacion = useCallback(
    (data: ProgramacionInsert): Promise<Programacion | null> => run(() => programacionRepository.create(data)),
    [run]
  );

  const toggleActivo = useCallback(
    (id: string, activo: boolean): Promise<boolean> => runVoid(() => programacionRepository.toggleActivo(id, activo)),
    [runVoid]
  );

  const deleteProgramacion = useCallback(
    (id: string): Promise<boolean> => runVoid(() => programacionRepository.delete(id)),
    [runVoid]
  );

  return { loading, error, getTipos, getProgramaciones, getProgramacionesActivas, createProgramacion, toggleActivo, deleteProgramacion };
}

export function useResponsables() {
  const { loading, error, run, runVoid } = useAsync();

  const getResponsablesPorFecha = useCallback(
    (programacionId: string, fecha: string): Promise<ResponsableProgramacion[] | null> =>
      run(() => responsableRepository.getByProgramacionYFecha(programacionId, fecha)),
    [run]
  );

  const getResponsablesFecha = useCallback(
    (fecha: string): Promise<ResponsableProgramacion[] | null> =>
      run(() => responsableRepository.getByFecha(fecha)),
    [run]
  );

  const getResponsablesRango = useCallback(
    (desde: string, hasta: string): Promise<ResponsableProgramacion[] | null> =>
      run(() => responsableRepository.getByRango(desde, hasta)),
    [run]
  );

  const asignarResponsable = useCallback(
    (data: ResponsableInsert): Promise<ResponsableProgramacion | null> =>
      run(() => responsableRepository.asignar(data)),
    [run]
  );

  const asignarVarios = useCallback(
    (data: ResponsableInsert[]): Promise<ResponsableProgramacion[] | null> =>
      run(() => responsableRepository.asignarVarios(data)),
    [run]
  );

  const toggleNotificado = useCallback(
    (id: string, notificado: boolean): Promise<boolean> => runVoid(() => responsableRepository.toggleNotificado(id, notificado)),
    [runVoid]
  );

  const eliminarResponsable = useCallback(
    (id: string): Promise<boolean> => runVoid(() => responsableRepository.eliminar(id)),
    [runVoid]
  );

  return { loading, error, getResponsablesPorFecha, getResponsablesFecha, getResponsablesRango, asignarResponsable, asignarVarios, toggleNotificado, eliminarResponsable };
}
