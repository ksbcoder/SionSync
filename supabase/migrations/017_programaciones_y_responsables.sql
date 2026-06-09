-- =============================================
-- 017: Programaciones, responsables y rol gestor_alabanza
-- =============================================

-- =========================
-- 1. Nuevo rol
-- =========================
INSERT INTO roles (name, description) VALUES
  ('gestor_alabanza', 'Gestor del equipo de alabanza — administra programaciones y asigna responsables');

-- =========================
-- 2. Tabla tipos_programacion
-- =========================
CREATE TABLE tipos_programacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO tipos_programacion (nombre) VALUES ('Aseo'), ('Sonido');

-- =========================
-- 3. Tabla programaciones
-- =========================
CREATE TABLE programaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_id UUID NOT NULL REFERENCES tipos_programacion(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- 4. Tabla responsables_programacion
-- =========================
CREATE TABLE responsables_programacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID NOT NULL REFERENCES programaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asignado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  notificado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(programacion_id, user_id, fecha)
);

-- =========================
-- 5. Índices
-- =========================
CREATE INDEX idx_programaciones_tipo_id ON programaciones(tipo_id);
CREATE INDEX idx_programaciones_user_id ON programaciones(user_id);
CREATE INDEX idx_programaciones_updated_by ON programaciones(updated_by);
CREATE INDEX idx_programaciones_activo ON programaciones(activo) WHERE activo = true;

CREATE INDEX idx_responsables_prog_programacion_id ON responsables_programacion(programacion_id);
CREATE INDEX idx_responsables_prog_user_id ON responsables_programacion(user_id);
CREATE INDEX idx_responsables_prog_asignado_por ON responsables_programacion(asignado_por);
CREATE INDEX idx_responsables_prog_fecha ON responsables_programacion(fecha);
CREATE INDEX idx_responsables_prog_notificado ON responsables_programacion(notificado);

-- =========================
-- 6. Función helper: can_gestionar_programacion
-- =========================
CREATE OR REPLACE FUNCTION can_gestionar_programacion(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'gestor_alabanza')
    AND (ur.module = 'global' OR ur.module = 'programaciones')
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION can_gestionar_programacion(UUID) FROM public, anon;

-- =========================
-- 7. Triggers
-- =========================

-- Reutilizar set_updated_by (ya existe) para programaciones
CREATE TRIGGER trg_programaciones_set_updated_by
  BEFORE INSERT OR UPDATE ON programaciones
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- Auto-setear asignado_por con auth.uid() al insertar responsables
CREATE OR REPLACE FUNCTION set_asignado_por()
RETURNS TRIGGER AS $$
BEGIN
  NEW.asignado_por = COALESCE(auth.uid(), NEW.asignado_por);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION set_asignado_por() FROM public, anon, authenticated;

CREATE TRIGGER trg_responsables_set_asignado_por
  BEFORE INSERT ON responsables_programacion
  FOR EACH ROW
  EXECUTE FUNCTION set_asignado_por();

-- =========================
-- 8. RLS
-- =========================
ALTER TABLE tipos_programacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsables_programacion ENABLE ROW LEVEL SECURITY;

-- tipos_programacion: lectura para autenticados, escritura solo admin
CREATE POLICY "Authenticated can read tipos_programacion"
  ON tipos_programacion FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Admin can insert tipos_programacion"
  ON tipos_programacion FOR INSERT
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "Admin can update tipos_programacion"
  ON tipos_programacion FOR UPDATE
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "Admin can delete tipos_programacion"
  ON tipos_programacion FOR DELETE
  USING (is_admin((select auth.uid())));

-- programaciones: lectura para autenticados, gestión para gestor/admin
CREATE POLICY "Authenticated can read programaciones"
  ON programaciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Gestor or admin can insert programaciones"
  ON programaciones FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND can_gestionar_programacion((select auth.uid()))
  );

CREATE POLICY "Gestor or admin can update programaciones"
  ON programaciones FOR UPDATE
  USING (can_gestionar_programacion((select auth.uid())))
  WITH CHECK (can_gestionar_programacion((select auth.uid())));

CREATE POLICY "Gestor or admin can delete programaciones"
  ON programaciones FOR DELETE
  USING (can_gestionar_programacion((select auth.uid())));

-- responsables_programacion: lectura para autenticados, gestión para gestor/admin
CREATE POLICY "Authenticated can read responsables_programacion"
  ON responsables_programacion FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Gestor or admin can insert responsables_programacion"
  ON responsables_programacion FOR INSERT
  WITH CHECK (can_gestionar_programacion((select auth.uid())));

CREATE POLICY "Gestor or admin can update responsables_programacion"
  ON responsables_programacion FOR UPDATE
  USING (can_gestionar_programacion((select auth.uid())))
  WITH CHECK (can_gestionar_programacion((select auth.uid())));

CREATE POLICY "Gestor or admin can delete responsables_programacion"
  ON responsables_programacion FOR DELETE
  USING (can_gestionar_programacion((select auth.uid())));

-- =========================
-- 9. Limpieza de responsables > 3 meses
-- =========================
CREATE OR REPLACE FUNCTION limpiar_responsables_antiguos()
RETURNS void AS $$
BEGIN
  DELETE FROM responsables_programacion
  WHERE fecha < CURRENT_DATE - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION limpiar_responsables_antiguos() FROM public, anon, authenticated;

-- Para activar limpieza automática semanal con pg_cron (requiere extensión habilitada):
SELECT cron.schedule('limpiar-responsables-antiguos', '0 3 * * 0', 'SELECT limpiar_responsables_antiguos()');
