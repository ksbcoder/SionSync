-- =====================================================================
-- SionSync — Migración: identificador único por dispositivo (device_id)
-- ---------------------------------------------------------------------
-- Cada navegador puede ROTAR su 'endpoint' (la dirección de Push). Antes,
-- al reactivar las notificaciones se creaba una fila nueva y la vieja
-- quedaba muerta, acumulando duplicados.
--
-- Ahora cada dispositivo trae un 'device_id': un código al azar que el
-- navegador genera UNA sola vez y guarda localmente. Con eso cada
-- dispositivo conserva UNA sola fila por usuario: al reactivar se ACTUALIZA
-- en vez de duplicarse, y dos equipos idénticos de la misma cuenta no se
-- pisan (cada uno tiene su propio carné).
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================

-- 1. Nueva columna con el "carné" del dispositivo.
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS device_id text;

-- 2. Empezamos en limpio: borramos TODAS las suscripciones actuales. Ninguna
--    tiene carné todavía (y varias ya están muertas), así que no dejamos
--    filas vacías. Cada dispositivo se volverá a registrar una sola vez al
--    activar las notificaciones de nuevo.
DELETE FROM push_subscriptions;

-- 3. De aquí en adelante, toda suscripción debe traer su carné. Lo dejamos
--    OBLIGATORIO a propósito: si fuera opcional, las filas sin carné podrían
--    volver a duplicarse, que es justo lo que estamos evitando.
ALTER TABLE push_subscriptions
  ALTER COLUMN device_id SET NOT NULL;

-- 4. Un dispositivo = una sola fila por usuario. Esta regla es la que el
--    guardado usa para ACTUALIZAR (en vez de duplicar) cuando un mismo
--    dispositivo vuelve a suscribirse con un endpoint nuevo.
--    (DROP IF EXISTS antes de crearla, para poder re-correr la migración
--    sin error si ya se había aplicado.)
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_usuario_dispositivo_unico;
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_usuario_dispositivo_unico
  UNIQUE (user_id, device_id);
