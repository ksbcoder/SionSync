import { seccionRepository } from '../infrastructure/seccion.repository';
import { notaRepository } from '../infrastructure/nota.repository';
import type { Seccion, SeccionInsert } from '../domain';

export const seccionService = {
  create: (data: SeccionInsert): Promise<Seccion> => seccionRepository.create(data),

  update: (id: string, data: Partial<Pick<SeccionInsert, 'tipo' | 'letra'>>): Promise<Seccion> =>
    seccionRepository.update(id, data),

  delete: (id: string): Promise<void> => seccionRepository.delete(id),

  reordenar: (ordenes: { id: string; orden: number }[]): Promise<void> =>
    seccionRepository.updateOrden(ordenes),

  async duplicar(seccion: Seccion, ordenSiguiente: number): Promise<Seccion> {
    const nueva = await seccionRepository.create({
      cancion_id: seccion.cancion_id,
      tipo: seccion.tipo,
      letra: seccion.letra,
      orden: ordenSiguiente,
    });

    if (seccion.notas?.length) {
      await notaRepository.createMany(
        seccion.notas.map(n => ({
          seccion_id: nueva.id,
          orden: n.orden,
          contenido: n.contenido,
        }))
      );
    }

    return nueva;
  },
};
