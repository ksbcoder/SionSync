import { notaRepository } from '../infrastructure/nota.repository';
import type { Nota, NotaInsert } from '../domain';

export const notaService = {
  getBySeccion: (seccionId: string): Promise<Nota[]> => notaRepository.getBySeccion(seccionId),
  create: (data: NotaInsert): Promise<Nota> => notaRepository.create(data),
  update: (id: string, contenido: string): Promise<Nota> => notaRepository.update(id, contenido),
  delete: (id: string): Promise<void> => notaRepository.delete(id),
};
