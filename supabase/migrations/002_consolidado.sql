-- =====================================================================
-- SionSync — Migración consolidada 002 (notificaciones, sesiones y extras)
-- ---------------------------------------------------------------------
-- Une, en su ESTADO FINAL, lo que antes eran siete migraciones (002 a 008):
--   · Notificaciones Push: tabla de dispositivos, seguridad, disparo y
--     los dos despertadores (cron) de las 6 p.m. y 6 a.m.
--   · Relación directa de responsables → profiles (nombres en una consulta).
--   · Sesiones de canciones (grupos ordenados de canciones).
--   · Reordenar secciones y canciones de forma atómica (una sola operación).
--
-- Se eliminaron los pasos intermedios que se anulaban entre sí (por ejemplo,
-- 'endpoint' nace ya como NO único, y la tabla de dispositivos nace con
-- 'device_id' obligatorio, sin el borrado de datos que hacía falta cuando
-- esa columna se agregó después).
--
-- ─── REQUISITOS / EJECUCIONES PROPIAS DE SUPABASE (no van en este archivo) ──
--   1) LLAVE SECRETA (Vault): la service_role_key NO se escribe aquí por
--      seguridad. Guárdala UNA sola vez en el SQL Editor:
--        select vault.create_secret(
--          'PEGA_AQUÍ_TU_SERVICE_ROLE_KEY',  -- Settings > API > service_role
--          'service_role_key'
--        );
--   2) EXTENSIONES: en el plan gratuito, si 'pg_cron'/'pg_net' no se dejan
--      crear por SQL, actívalas a mano en Database > Extensions.
--   3) URL DEL PROYECTO: la función de disparo apunta a este proyecto
--      (xylscugvyfityhybgrxr). Si cambias de proyecto, actualiza la URL.
--
-- ─── CUÁNDO CORRERLA ────────────────────────────────────────────────
--   · Va DESPUÉS de 001 (depende de profiles, responsables_programacion,
--     canciones y secciones). NO reemplaza a la 001, la complementa.
--   · La base de producción YA tiene todo esto aplicado: este archivo es
--     para levantar la base DESDE CERO (proyecto nuevo o de pruebas) y para
--     dejar documentado el estado final.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================


-- ═════════════════════════════════════════════════════════════════
-- A. NOTIFICACIONES PUSH
-- ═════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- A.1 EXTENSIONES
-- pg_net: permite que la base haga llamadas web (invocar la función).
-- pg_cron: permite agendar tareas que corren solas a una hora fija.
-- (Si tu plan no las deja crear por SQL, actívalas en Database > Extensions.)
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ─────────────────────────────────────────────────────────────────
-- A.2 TABLA DE DISPOSITIVOS SUSCRITOS
-- Una fila por cada dispositivo donde el usuario activó las notificaciones.
-- 'endpoint' es la dirección que el navegador entrega para recibir avisos;
-- 'p256dh' y 'auth' son las claves con las que se cifra el mensaje.
--
-- 'endpoint' NO es único: en un equipo compartido por varias cuentas, la
-- suscripción es del navegador, así que la misma dirección puede pertenecer
-- a varias cuentas. La unicidad correcta es (user_id, device_id): un
-- dispositivo, una sola fila por usuario. 'device_id' es un "carné" que el
-- navegador genera una vez y guarda localmente, para no acumular duplicados
-- cuando el endpoint rota.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT push_subscriptions_usuario_dispositivo_unico UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
-- Índice (NO único) sobre 'endpoint': el envío de avisos borra por esa
-- columna cuando una dirección caduca (404/410).
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);


-- ─────────────────────────────────────────────────────────────────
-- A.3 ROW LEVEL SECURITY
-- Cada usuario solo ve y administra sus propios dispositivos.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read push_subscriptions" ON push_subscriptions;
CREATE POLICY "Owner can read push_subscriptions"
  ON push_subscriptions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owner can insert push_subscriptions" ON push_subscriptions;
CREATE POLICY "Owner can insert push_subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owner can update push_subscriptions" ON push_subscriptions;
CREATE POLICY "Owner can update push_subscriptions"
  ON push_subscriptions FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Owner can delete push_subscriptions" ON push_subscriptions;
CREATE POLICY "Owner can delete push_subscriptions"
  ON push_subscriptions FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ─────────────────────────────────────────────────────────────────
-- A.4 FUNCIÓN DE DISPARO
-- Llama a la Edge Function 'enviar-recordatorios'. Se puede ejecutar a
-- mano para PROBAR a cualquier hora:  select disparar_recordatorios();
--   · dias_antes: 1 = mañana (por defecto), 0 = hoy, etc.
--   · fecha:      una fecha exacta (tiene prioridad sobre dias_antes).
--   · forzar:     reenvía aunque los responsables ya estuvieran avisados.
-- La service_role key se lee de la bóveda (Vault), nunca está en el código.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION disparar_recordatorios(
  dias_antes integer DEFAULT 1,
  fecha date DEFAULT NULL,
  forzar boolean DEFAULT false
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Falta registrar el secreto ''service_role_key'' en Vault (ver encabezado de la migración).';
  END IF;

  SELECT net.http_post(
    url := 'https://xylscugvyfityhybgrxr.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'dias_antes', dias_antes,
      'fecha', fecha,
      'forzar', forzar
    )
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION disparar_recordatorios(integer, date, boolean) FROM public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- A.5 DESPERTADORES DIARIOS (cron)
-- Hora en UTC: Colombia es UTC-5 (sin horario de verano).
--   · 6:00 p.m. Colombia = 23:00 UTC  -> avisa de MAÑANA (dias_antes = 1).
--   · 6:00 a.m. Colombia = 11:00 UTC  -> recuerda HOY (dias_antes = 0).
-- El de la mañana usa 'forzar = true' porque el de la tarde ya marcó a esas
-- personas como avisadas; sin forzar, las saltaría y no enviaría nada.
-- (cron.schedule actualiza el trabajo si el nombre ya existe.)
-- ─────────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'recordatorios-programacion',
  '0 23 * * *',                          -- 23:00 UTC = 6:00 p.m. Colombia
  $$ SELECT disparar_recordatorios(1, NULL, false); $$
);

SELECT cron.schedule(
  'recordatorios-mismo-dia',
  '0 11 * * *',                          -- 11:00 UTC = 6:00 a.m. Colombia
  $$ SELECT disparar_recordatorios(0, NULL, true); $$
);

-- Para apagar un despertador:
--   SELECT cron.unschedule('recordatorios-programacion');
--   SELECT cron.unschedule('recordatorios-mismo-dia');


-- ═════════════════════════════════════════════════════════════════
-- B. RESPONSABLES → PROFILES (nombres en una sola consulta)
-- Relaciones (FK) de 'user_id' y 'asignado_por' hacia 'profiles(id)', para
-- traer el responsable y su nombre (y el de quien asignó) sin una segunda
-- consulta. 'profiles.id' es la misma identidad que 'auth.users.id'.
-- ═════════════════════════════════════════════════════════════════
ALTER TABLE responsables_programacion
  DROP CONSTRAINT IF EXISTS responsables_programacion_user_id_profiles_fkey;
ALTER TABLE responsables_programacion
  ADD CONSTRAINT responsables_programacion_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE responsables_programacion
  DROP CONSTRAINT IF EXISTS responsables_programacion_asignado_por_profiles_fkey;
ALTER TABLE responsables_programacion
  ADD CONSTRAINT responsables_programacion_asignado_por_profiles_fkey
  FOREIGN KEY (asignado_por) REFERENCES profiles(id) ON DELETE CASCADE;


-- ═════════════════════════════════════════════════════════════════
-- C. SESIONES DE CANCIONES
-- Una "sesión" es un grupo ordenado de canciones (sacadas del catálogo) que
-- se tocarán un día. La sesión NO copia las canciones: solo las referencia.
-- ═════════════════════════════════════════════════════════════════

-- ─── C.1 TABLAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha date,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesion_canciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (sesion_id, cancion_id)
);

-- ─── C.2 ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sesiones_user_id ON sesiones(user_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_updated_by ON sesiones(updated_by);
CREATE INDEX IF NOT EXISTS idx_sesion_canciones_sesion_id ON sesion_canciones(sesion_id);
CREATE INDEX IF NOT EXISTS idx_sesion_canciones_cancion_id ON sesion_canciones(cancion_id);

-- ─── C.3 TRIGGERS (reusan funciones del esquema base 001) ─────────
-- Registra automáticamente quién y cuándo modificó la sesión.
DROP TRIGGER IF EXISTS trg_sesiones_set_updated_by ON sesiones;
CREATE TRIGGER trg_sesiones_set_updated_by
  BEFORE INSERT OR UPDATE ON sesiones
  FOR EACH ROW EXECUTE FUNCTION set_updated_by();

-- Al agregar/quitar/reordenar canciones, marca la sesión como modificada.
CREATE OR REPLACE FUNCTION propagar_actualizacion_sesion()
RETURNS trigger AS $$
DECLARE
  v_sesion_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_sesion_id := OLD.sesion_id;
  ELSE
    v_sesion_id := NEW.sesion_id;
  END IF;
  UPDATE sesiones SET updated_at = now() WHERE id = v_sesion_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION propagar_actualizacion_sesion() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sesion_canciones_propagar ON sesion_canciones;
CREATE TRIGGER trg_sesion_canciones_propagar
  AFTER INSERT OR UPDATE OR DELETE ON sesion_canciones
  FOR EACH ROW EXECUTE FUNCTION propagar_actualizacion_sesion();

-- ─── C.4 ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_canciones ENABLE ROW LEVEL SECURITY;

-- sesiones -----------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read sesiones" ON sesiones;
CREATE POLICY "Authenticated can read sesiones"
  ON sesiones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Alabanza or admin can insert sesiones" ON sesiones;
CREATE POLICY "Alabanza or admin can insert sesiones"
  ON sesiones FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND can_create_canciones((select auth.uid()))
  );

DROP POLICY IF EXISTS "Owner gestor or admin can update sesiones" ON sesiones;
CREATE POLICY "Owner gestor or admin can update sesiones"
  ON sesiones FOR UPDATE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

DROP POLICY IF EXISTS "Owner gestor or admin can delete sesiones" ON sesiones;
CREATE POLICY "Owner gestor or admin can delete sesiones"
  ON sesiones FOR DELETE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

-- sesion_canciones ---------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read sesion_canciones" ON sesion_canciones;
CREATE POLICY "Authenticated can read sesion_canciones"
  ON sesion_canciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Owner gestor or admin can insert sesion_canciones" ON sesion_canciones;
CREATE POLICY "Owner gestor or admin can insert sesion_canciones"
  ON sesion_canciones FOR INSERT
  WITH CHECK (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

DROP POLICY IF EXISTS "Owner gestor or admin can update sesion_canciones" ON sesion_canciones;
CREATE POLICY "Owner gestor or admin can update sesion_canciones"
  ON sesion_canciones FOR UPDATE
  USING (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  )
  WITH CHECK (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

DROP POLICY IF EXISTS "Owner gestor or admin can delete sesion_canciones" ON sesion_canciones;
CREATE POLICY "Owner gestor or admin can delete sesion_canciones"
  ON sesion_canciones FOR DELETE
  USING (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

-- ─── C.5 TIEMPO REAL ──────────────────────────────────────────────
-- (Envuelto para no fallar si la tabla ya está en la publicación.)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sesiones;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sesion_canciones;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE sesiones REPLICA IDENTITY FULL;
ALTER TABLE sesion_canciones REPLICA IDENTITY FULL;


-- ═════════════════════════════════════════════════════════════════
-- D. REORDENAR EN BLOQUE (ATÓMICO)
-- Reciben TODA la nueva numeración de una vez (un arreglo JSON de
-- { id, orden }) y la aplican en una sola sentencia, dentro de una
-- transacción: o se actualizan todas las filas o ninguna.
-- SECURITY INVOKER: corren con los permisos de quien las llama, así que
-- siguen respetando las reglas de acceso (RLS) de cada tabla.
-- ═════════════════════════════════════════════════════════════════

-- Reordena varias secciones de una canción de una sola vez.
CREATE OR REPLACE FUNCTION reordenar_secciones(ordenes jsonb)
RETURNS void AS $$
BEGIN
  UPDATE secciones AS s
  SET orden = (o->>'orden')::int
  FROM jsonb_array_elements(ordenes) AS o
  WHERE s.id = (o->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Reordena varias canciones dentro de una sesión de una sola vez.
CREATE OR REPLACE FUNCTION reordenar_sesion_canciones(ordenes jsonb)
RETURNS void AS $$
BEGIN
  UPDATE sesion_canciones AS sc
  SET orden = (o->>'orden')::int
  FROM jsonb_array_elements(ordenes) AS o
  WHERE sc.id = (o->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION reordenar_secciones(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION reordenar_sesion_canciones(jsonb) TO authenticated;
