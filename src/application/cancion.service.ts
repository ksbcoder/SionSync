import { cancionRepository } from '../infrastructure/cancion.repository';
import type { Cancion, CancionInsert } from '../domain';

export const cancionService = {
  getAll: (): Promise<Cancion[]> => cancionRepository.getAll(),
  getById: (id: string): Promise<Cancion> => cancionRepository.getById(id),
  create: (data: CancionInsert): Promise<Cancion> => cancionRepository.create(data),
  update: (id: string, data: Partial<CancionInsert>): Promise<Cancion> => cancionRepository.update(id, data),
  delete: (id: string): Promise<void> => cancionRepository.delete(id),
  buscar: (query: string): Promise<Cancion[]> => cancionRepository.buscar(query),
};
