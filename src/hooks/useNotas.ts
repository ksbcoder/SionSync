import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { notaService } from '../application/nota.service';
import type { Nota, NotaInsert } from '../domain';

export function useNotas() {
  const { loading, error, run, runVoid } = useAsync();

  const getNotas = useCallback(
    (seccionId: string): Promise<Nota[] | null> => run(() => notaService.getBySeccion(seccionId)),
    [run]
  );

  const addNota = useCallback(
    (data: NotaInsert): Promise<Nota | null> => run(() => notaService.create(data)),
    [run]
  );

  const updateNota = useCallback(
    (id: string, contenido: string): Promise<Nota | null> => run(() => notaService.update(id, contenido)),
    [run]
  );

  const deleteNota = useCallback(
    (id: string): Promise<boolean> => runVoid(() => notaService.delete(id)),
    [runVoid]
  );

  return { loading, error, getNotas, addNota, updateNota, deleteNota };
}
