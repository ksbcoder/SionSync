import { useState, useEffect, useCallback } from 'react';
import { pushRepository, APPLICATION_SERVER_KEY } from '../infrastructure/push.repository';

export type EstadoPush = 'cargando' | 'no-soportado' | 'denegado' | 'activo' | 'inactivo';

// El navegador debe ofrecer las tres piezas para que funcione el Web Push.
const soportado =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/**
 * Controla las notificaciones Push de este dispositivo: si están activas,
 * y las acciones para activarlas (pedir permiso + suscribir + guardar) o
 * desactivarlas (borrar la suscripción).
 */
export function usePushNotifications() {
  const [estado, setEstado] = useState<EstadoPush>('cargando');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!soportado) {
      setEstado('no-soportado');
      return;
    }
    if (Notification.permission === 'denied') {
      setEstado('denegado');
      return;
    }
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setEstado(sub ? 'activo' : 'inactivo'))
      .catch(() => setEstado('inactivo'));
  }, []);

  const activar = useCallback(async () => {
    if (!soportado || procesando) return;
    if (!APPLICATION_SERVER_KEY) {
      throw new Error('Falta configurar la clave pública de notificaciones.');
    }
    setProcesando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'denegado' : 'inactivo');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: APPLICATION_SERVER_KEY as BufferSource,
        }));
      await pushRepository.guardarSuscripcion(sub);
      setEstado('activo');
    } catch (e) {
      setEstado('inactivo');
      throw e;
    } finally {
      setProcesando(false);
    }
  }, [procesando]);

  const desactivar = useCallback(async () => {
    if (procesando) return;
    setProcesando(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushRepository.eliminarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado('inactivo');
    } finally {
      setProcesando(false);
    }
  }, [procesando]);

  return { estado, procesando, soportado, activar, desactivar };
}
