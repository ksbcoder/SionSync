-- =====================================================================
-- SionSync — Migración: la dirección de Push puede repetirse entre cuentas
-- ---------------------------------------------------------------------
-- En un dispositivo compartido por varias cuentas (p. ej. el mismo iPhone
-- con dos usuarios), la suscripción de Push es del NAVEGADOR, no de la
-- cuenta: todas las cuentas comparten la misma dirección (endpoint).
--
-- La tabla tenía 'endpoint' como ÚNICO a nivel global, así que la segunda
-- cuenta no podía guardar su fila (chocaba con la de la primera) y se le
-- volvía a ofrecer activar las notificaciones una y otra vez.
--
-- La unicidad correcta ya existe: (user_id, device_id) — un dispositivo,
-- una fila por usuario. Aquí solo quitamos la unicidad global de 'endpoint'
-- para que la misma dirección pueda pertenecer a varias cuentas del equipo.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================

-- 1. Quitamos la restricción ÚNICA de una sola columna sobre 'endpoint',
--    sea cual sea su nombre (Postgres la llamó al crear la tabla).
DO $$
DECLARE
  nombre_constraint text;
BEGIN
  SELECT con.conname INTO nombre_constraint
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
  WHERE rel.relname = 'push_subscriptions'
    AND con.contype = 'u'                 -- unique
    AND array_length(con.conkey, 1) = 1   -- de una sola columna
    AND att.attname = 'endpoint';

  IF nombre_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE push_subscriptions DROP CONSTRAINT %I', nombre_constraint);
  END IF;
END $$;

-- 2. Mantenemos un índice (NO único) sobre 'endpoint', porque el envío de
--    avisos borra por esa columna cuando una dirección caduca (404/410).
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
  ON push_subscriptions(endpoint);
