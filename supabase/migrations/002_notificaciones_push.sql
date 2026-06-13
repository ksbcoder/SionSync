-- =====================================================================
-- SionSync — Notificaciones Push (Web Push)
-- ---------------------------------------------------------------------
-- Crea, de una sola vez, todo lo que vive en la base de datos:
--   · La tabla de dispositivos suscritos y sus reglas de seguridad.
--   · La función que llama al "cartero" (Edge Function) que envía avisos.
--   · El despertador diario (cron) que recuerda a los responsables.
--
-- REQUISITO PREVIO (una sola vez, NO va en este archivo por seguridad):
--   Guardar la service_role key en la bóveda (Vault), porque escribirla
--   aquí la expondría en GitHub. En el SQL Editor del panel ejecuta:
--
--     select vault.create_secret(
--       'PEGA_AQUÍ_TU_SERVICE_ROLE_KEY',  -- Settings > API > service_role
--       'service_role_key'
--     );
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. EXTENSIONES
-- pg_net: permite que la base haga llamadas web (invocar la función).
-- pg_cron: permite agendar tareas que corren solas a una hora fija.
-- (Si tu plan no las deja crear por SQL, actívalas en Database > Extensions.)
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ─────────────────────────────────────────────────────────────────
-- 2. TABLA
-- Una fila por cada dispositivo donde el usuario activó las notificaciones.
-- 'endpoint' es la dirección única que el navegador entrega para recibir
-- avisos; 'p256dh' y 'auth' son las claves con las que se cifra el mensaje.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);


-- ─────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
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
-- 4. FUNCIÓN DE DISPARO
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
-- 5. DESPERTADOR DIARIO (cron)
-- Hora en UTC: Colombia (UTC-5) son 5 horas más, así que las 6:00 p.m.
-- de Colombia = 23:00 UTC. Para CAMBIAR LA HORA, vuelve a ejecutar este
-- bloque con otra expresión (formato: minuto hora * * *).
-- ─────────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'recordatorios-programacion',
  '0 23 * * *',                          -- 23:00 UTC = 6:00 p.m. Colombia
  $$ SELECT disparar_recordatorios(1, NULL, false); $$
);

-- Para apagar el despertador:
--   SELECT cron.unschedule('recordatorios-programacion');
