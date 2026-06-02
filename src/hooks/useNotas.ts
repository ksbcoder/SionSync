import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { notaRepository } from '../infrastructure/nota.repository';
import type { Nota, NotaInsert } from '../domain';

export function useNotas() {
  const { loading, error, run, runVoid } = useAsync();

  const getNotas = useCallback(
    (seccionId: string): Promise<Nota[] | null> => run(() => notaRepository.getBySeccion(seccionId)),
    [run]
  );

  const addNota = useCallback(
    (data: NotaInsert): Promise<Nota | null> => run(() => notaRepository.create(data)),
    [run]
  );

  const updateNota = useCallback(
    (id: string, contenido: string): Promise<Nota | null> => run(() => notaRepository.update(id, contenido)),
    [run]
  );

  const deleteNota = useCallback(
    (id: string): Promise<boolean> => runVoid(() => notaRepository.delete(id)),
    [runVoid]
  );

  return { loading, error, getNotas, addNota, updateNota, deleteNota };
}
