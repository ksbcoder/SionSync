-- =====================================================================
-- SionSync — Migración: sesiones de canciones
-- ---------------------------------------------------------------------
-- Una "sesión" es un grupo ordenado de canciones (sacadas del catálogo)
-- que se tocarán un día. La sesión NO copia las canciones: solo las
-- referencia, así un cambio en la letra se ve igual en el catálogo y en
-- toda sesión que la use.
--
-- Se agregan dos tablas:
--   - sesiones:          cada grupo (con nombre y fecha opcional).
--   - sesion_canciones:  qué canciones tiene cada sesión y en qué orden.
--
-- Permisos: igual que las canciones. Crear → quien pueda crear canciones
-- (admin, gestor o miembro de alabanza). Editar/eliminar → el dueño o
-- quien gestione canciones. Leer → cualquier usuario autenticado.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. TABLAS
-- ─────────────────────────────────────────────────────────────────

-- Una sesión: grupo de canciones para tocar un día (con su dueño y quién
-- la modificó por última vez). La fecha es opcional, pensada para uso futuro.
CREATE TABLE sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha date,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Canciones que componen una sesión, con su orden. Es solo un vínculo:
-- sesión ↔ canción del catálogo. Si la canción se borra, se quita sola.
CREATE TABLE sesion_canciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (sesion_id, cancion_id)
);

-- ─────────────────────────────────────────────────────────────────
-- 2. ÍNDICES
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_sesiones_user_id ON sesiones(user_id);
CREATE INDEX idx_sesiones_updated_by ON sesiones(updated_by);
CREATE INDEX idx_sesion_canciones_sesion_id ON sesion_canciones(sesion_id);
CREATE INDEX idx_sesion_canciones_cancion_id ON sesion_canciones(cancion_id);

-- ─────────────────────────────────────────────────────────────────
-- 3. TRIGGERS (reusa funciones ya existentes del esquema base)
-- ─────────────────────────────────────────────────────────────────

-- Registra automáticamente quién y cuándo modificó la sesión.
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

CREATE TRIGGER trg_sesion_canciones_propagar
  AFTER INSERT OR UPDATE OR DELETE ON sesion_canciones
  FOR EACH ROW EXECUTE FUNCTION propagar_actualizacion_sesion();

-- ─────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_canciones ENABLE ROW LEVEL SECURITY;

-- sesiones -----------------------------------------------------------
CREATE POLICY "Authenticated can read sesiones"
  ON sesiones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Alabanza or admin can insert sesiones"
  ON sesiones FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND can_create_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update sesiones"
  ON sesiones FOR UPDATE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

CREATE POLICY "Owner gestor or admin can delete sesiones"
  ON sesiones FOR DELETE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

-- sesion_canciones ---------------------------------------------------
CREATE POLICY "Authenticated can read sesion_canciones"
  ON sesion_canciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner gestor or admin can insert sesion_canciones"
  ON sesion_canciones FOR INSERT
  WITH CHECK (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

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

CREATE POLICY "Owner gestor or admin can delete sesion_canciones"
  ON sesion_canciones FOR DELETE
  USING (
    sesion_id IN (SELECT id FROM sesiones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

-- ─────────────────────────────────────────────────────────────────
-- 5. TIEMPO REAL
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE sesiones;
ALTER PUBLICATION supabase_realtime ADD TABLE sesion_canciones;

ALTER TABLE sesiones REPLICA IDENTITY FULL;
ALTER TABLE sesion_canciones REPLICA IDENTITY FULL;
