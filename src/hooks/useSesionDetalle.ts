import { useState, useEffect, useCallback } from 'react';
import { useSesiones } from './useSesiones';
import { calcularSiguienteOrden } from '../domain';
import type { SesionConCanciones } from '../domain';

/**
 * Concentra el estado de la pantalla de detalle de una sesión: la sesión con
 * sus canciones ordenadas y las acciones para agregar, quitar y reordenar.
 */
export function useSesionDetalle(id: string | undefined) {
  const { getSesion, agregarVarias, quitarCancion, reordenar } = useSesiones();
  const [sesion, setSesion] = useState<SesionConCanciones | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getSesion(id);
    setSesion(data);
    setLoading(false);
  }, [id, getSesion]);

  useEffect(() => { cargar(); }, [cargar]);

  const canciones = [...(sesion?.canciones ?? [])].sort((a, b) => a.orden - b.orden);

  // Agrega varias canciones del catálogo al final de la sesión, en bloque.
  const agregarCanciones = useCallback(async (cancionIds: string[]) => {
    if (!id || cancionIds.length === 0) return;
    let orden = calcularSiguienteOrden(sesion?.canciones ?? []);
    const items = cancionIds.map(cancionId => ({ cancionId, orden: orden++ }));
    await agregarVarias(id, items);
    await cargar();
  }, [id, sesion, agregarVarias, cargar]);

  const quitar = useCallback(async (sesionCancionId: string) => {
    await quitarCancion(sesionCancionId);
    await cargar();
  }, [quitarCancion, cargar]);

  // Intercambia el orden de una canción con su vecina (arriba o abajo).
  const mover = useCallback(async (sesionCancionId: string, direccion: 'arriba' | 'abajo') => {
    const ordenadas = [...(sesion?.canciones ?? [])].sort((a, b) => a.orden - b.orden);
    const idx = ordenadas.findIndex(c => c.id === sesionCancionId);
    if (direccion === 'arriba' && idx <= 0) return;
    if (direccion === 'abajo' && idx === ordenadas.length - 1) return;
    const swapIdx = direccion === 'arriba' ? idx - 1 : idx + 1;
    const nuevosOrdenes = ordenadas.map((c, i) => {
      if (i === idx) return { id: c.id, orden: ordenadas[swapIdx].orden };
      if (i === swapIdx) return { id: c.id, orden: ordenadas[idx].orden };
      return { id: c.id, orden: c.orden };
    });
    await reordenar(nuevosOrdenes);
    await cargar();
  }, [sesion, reordenar, cargar]);

  return { sesion, loading, canciones, cargar, agregarCanciones, quitar, mover };
}
