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
    let cancelado = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        // 'activo' solo si este navegador tiene suscripción Y esta cuenta la
        // tiene guardada en la base. En un equipo compartido, otra cuenta pudo
        // dejar la suscripción del navegador, pero esta cuenta no está en la
        // base: para ella sigue siendo 'inactivo'.
        const enLaBase = sub
          ? await pushRepository.tieneSuscripcionEnEsteDispositivo()
          : false;
        if (!cancelado) setEstado(sub && enLaBase ? 'activo' : 'inactivo');
      } catch {
        if (!cancelado) setEstado('inactivo');
      }
    })();
    return () => { cancelado = true; };
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
      // Solo borramos la fila de ESTA cuenta (por su carné de dispositivo).
      // No soltamos la suscripción del navegador: en un equipo compartido es
      // la misma para varias cuentas, y por seguridad (RLS) no podemos ver si
      // otra cuenta aún la necesita. Sin fila en la base, ya no le llegan avisos.
      await pushRepository.eliminarSuscripcion();
      setEstado('inactivo');
    } finally {
      setProcesando(false);
    }
  }, [procesando]);

  return { estado, procesando, soportado, activar, desactivar };
}
