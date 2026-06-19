import { useCallback } from 'react';
import { useAsync } from './useAsync';
import { iaRepository, type ResultadoGeneracion } from '../infrastructure/ia.repository';

export function useGenerarLetra() {
  const { loading, error, run } = useAsync();

  const generarLetra = useCallback(
    (titulo: string, autor: string | null): Promise<ResultadoGeneracion | null> =>
      run(() => iaRepository.generarLetra(titulo, autor)),
    [run]
  );

  return { loading, error, generarLetra };
}
