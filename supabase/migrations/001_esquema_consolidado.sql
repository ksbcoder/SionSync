-- =====================================================================
-- SionSync — Esquema consolidado (baseline)
-- ---------------------------------------------------------------------
-- Reemplaza las migraciones 001–021. Representa el estado final del
-- esquema tal como existe en producción (verificado el 2026-06-12).
--
-- Para una base de datos NUEVA: ejecutar este archivo de principio a fin.
-- Para producción (que ya tiene todo aplicado): NO ejecutar; ya existe.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. TABLAS
-- ─────────────────────────────────────────────────────────────────

-- Canciones (con su dueño y quién la modificó por última vez)
CREATE TABLE canciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor text,
  tonalidad text,
  tempo integer,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Secciones de una canción (verso, coro, etc.)
CREATE TABLE secciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('verso', 'coro', 'pre-coro', 'puente', 'intro', 'outro', 'final', 'otro')),
  orden integer NOT NULL DEFAULT 0,
  letra text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Notas dentro de una sección
CREATE TABLE notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion_id uuid NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Perfiles públicos (se crean solos al registrarse un usuario)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) <= 50),
  active boolean NOT NULL DEFAULT true,
  data_consent_at timestamptz,
  data_consent_version text,
  created_at timestamptz DEFAULT now()
);

-- Roles del sistema
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text
);

-- Asignación de roles a usuarios, por módulo
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module text NOT NULL DEFAULT 'global',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role_id, module)
);

-- Tipos de programación (Aseo, Sonido, …) con un color para distinguirlos
CREATE TABLE tipos_programacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Programaciones (una agenda por tipo)
CREATE TABLE programaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_id uuid NOT NULL REFERENCES tipos_programacion(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Responsables asignados a una programación en una fecha
CREATE TABLE responsables_programacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id uuid NOT NULL REFERENCES programaciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asignado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  notificado boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (programacion_id, user_id, fecha)
);


-- ─────────────────────────────────────────────────────────────────
-- 2. ÍNDICES (sobre llaves foráneas y filtros frecuentes)
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_secciones_cancion_id ON secciones(cancion_id);
CREATE INDEX idx_notas_seccion_id ON notas(seccion_id);
CREATE INDEX idx_canciones_user_id ON canciones(user_id);
CREATE INDEX idx_canciones_updated_by ON canciones(updated_by);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_programaciones_tipo_id ON programaciones(tipo_id);
CREATE INDEX idx_programaciones_user_id ON programaciones(user_id);
CREATE INDEX idx_programaciones_updated_by ON programaciones(updated_by);
CREATE INDEX idx_programaciones_activo ON programaciones(activo) WHERE activo = true;
CREATE INDEX idx_responsables_prog_programacion_id ON responsables_programacion(programacion_id);
CREATE INDEX idx_responsables_prog_user_id ON responsables_programacion(user_id);
CREATE INDEX idx_responsables_prog_asignado_por ON responsables_programacion(asignado_por);
CREATE INDEX idx_responsables_prog_fecha ON responsables_programacion(fecha);
CREATE INDEX idx_responsables_prog_notificado ON responsables_programacion(notificado);


-- ─────────────────────────────────────────────────────────────────
-- 3. SCHEMA INTERNO Y FUNCIONES
-- ─────────────────────────────────────────────────────────────────

-- Schema interno: no se expone por la API REST
CREATE SCHEMA IF NOT EXISTS internal;
GRANT USAGE ON SCHEMA internal TO authenticated;

-- Verifica si un usuario es admin SALTANDO RLS.
-- Vive en 'internal' y es SECURITY DEFINER para usarse dentro de las
-- propias políticas de user_roles sin caer en recursión.
CREATE OR REPLACE FUNCTION internal.is_admin_no_rls(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
      AND r.name = 'admin'
      AND ur.module = 'global'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION internal.is_admin_no_rls(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION internal.is_admin_no_rls(uuid) TO authenticated;

-- Helpers de roles para las políticas (SECURITY INVOKER: solo leen
-- tablas que el usuario ya puede consultar bajo RLS).
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
      AND r.name = 'admin'
      AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_create_canciones(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
      AND r.name IN ('admin', 'miembro_alabanza', 'gestor_alabanza')
      AND (ur.module = 'global' OR ur.module = 'canciones')
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_gestionar_canciones(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
      AND r.name IN ('admin', 'gestor_alabanza')
      AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_gestionar_programacion(check_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
      AND r.name IN ('admin', 'gestor_alabanza')
      AND (ur.module = 'global' OR ur.module = 'programaciones')
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION is_admin(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION can_create_canciones(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION can_gestionar_canciones(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION can_gestionar_programacion(uuid) FROM public, anon;

-- Al registrarse un usuario: crear su perfil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Al registrarse un usuario: asignarle el rol por defecto
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, module)
  SELECT NEW.id, id, 'global'
  FROM roles WHERE name = 'miembro_nuevo';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION assign_default_role() FROM public, anon, authenticated;

-- Auditoría: registra quién modificó la canción y cuándo
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS trigger AS $$
BEGIN
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by, NEW.user_id);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Propaga al padre (canciones) los cambios hechos en secciones
CREATE OR REPLACE FUNCTION propagar_actualizacion_cancion()
RETURNS trigger AS $$
DECLARE
  v_cancion_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cancion_id := OLD.cancion_id;
  ELSE
    v_cancion_id := NEW.cancion_id;
  END IF;
  UPDATE canciones SET updated_at = now() WHERE id = v_cancion_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Propaga al padre (canciones, vía sección) los cambios hechos en notas
CREATE OR REPLACE FUNCTION propagar_actualizacion_cancion_desde_nota()
RETURNS trigger AS $$
DECLARE
  v_seccion_id uuid;
  v_cancion_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_seccion_id := OLD.seccion_id;
  ELSE
    v_seccion_id := NEW.seccion_id;
  END IF;
  SELECT cancion_id INTO v_cancion_id FROM secciones WHERE id = v_seccion_id;
  IF v_cancion_id IS NOT NULL THEN
    UPDATE canciones SET updated_at = now() WHERE id = v_cancion_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Registra quién asignó un responsable
CREATE OR REPLACE FUNCTION set_asignado_por()
RETURNS trigger AS $$
BEGIN
  NEW.asignado_por = COALESCE(auth.uid(), NEW.asignado_por);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION set_updated_by() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION propagar_actualizacion_cancion() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION propagar_actualizacion_cancion_desde_nota() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION set_asignado_por() FROM public, anon, authenticated;

-- Borra responsables de más de 3 meses (se invoca por agenda; ver sección 8)
CREATE OR REPLACE FUNCTION limpiar_responsables_antiguos()
RETURNS void AS $$
BEGIN
  DELETE FROM responsables_programacion
  WHERE fecha < CURRENT_DATE - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION limpiar_responsables_antiguos() FROM public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ─────────────────────────────────────────────────────────────────

-- Provisión automática al crear un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_default_role();

-- Auditoría y propagación de fechas
CREATE TRIGGER trg_canciones_set_updated_by
  BEFORE INSERT OR UPDATE ON canciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER trg_secciones_propagar
  AFTER INSERT OR UPDATE OR DELETE ON secciones
  FOR EACH ROW EXECUTE FUNCTION propagar_actualizacion_cancion();

CREATE TRIGGER trg_notas_propagar
  AFTER INSERT OR UPDATE OR DELETE ON notas
  FOR EACH ROW EXECUTE FUNCTION propagar_actualizacion_cancion_desde_nota();

CREATE TRIGGER trg_programaciones_set_updated_by
  BEFORE INSERT OR UPDATE ON programaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER trg_responsables_set_asignado_por
  BEFORE INSERT ON responsables_programacion
  FOR EACH ROW EXECUTE FUNCTION set_asignado_por();


-- ─────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (reglas de acceso por usuario y rol)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE canciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_programacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsables_programacion ENABLE ROW LEVEL SECURITY;

-- canciones ----------------------------------------------------------
CREATE POLICY "Authenticated can read canciones"
  ON canciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Alabanza or admin can insert canciones"
  ON canciones FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND can_create_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update canciones"
  ON canciones FOR UPDATE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

CREATE POLICY "Owner gestor or admin can delete canciones"
  ON canciones FOR DELETE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

-- secciones ----------------------------------------------------------
CREATE POLICY "Authenticated can read secciones"
  ON secciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner gestor or admin can insert secciones"
  ON secciones FOR INSERT
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update secciones"
  ON secciones FOR UPDATE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  )
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can delete secciones"
  ON secciones FOR DELETE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

-- notas --------------------------------------------------------------
CREATE POLICY "Authenticated can read notas"
  ON notas FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner gestor or admin can insert notas"
  ON notas FOR INSERT
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update notas"
  ON notas FOR UPDATE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  )
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can delete notas"
  ON notas FOR DELETE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );

-- profiles -----------------------------------------------------------
CREATE POLICY "Authenticated can read profiles"
  ON profiles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner or admin can update profiles"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = id OR is_admin((select auth.uid())));

-- roles --------------------------------------------------------------
CREATE POLICY "Authenticated can read roles"
  ON roles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- user_roles ---------------------------------------------------------
CREATE POLICY "Authenticated can read user_roles"
  ON user_roles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (internal.is_admin_no_rls((select auth.uid())));

CREATE POLICY "Admins can update user_roles"
  ON user_roles FOR UPDATE
  USING (internal.is_admin_no_rls((select auth.uid())))
  WITH CHECK (internal.is_admin_no_rls((select auth.uid())));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (internal.is_admin_no_rls((select auth.uid())));

-- tipos_programacion -------------------------------------------------
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

-- programaciones -----------------------------------------------------
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

-- responsables_programacion ------------------------------------------
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


-- ─────────────────────────────────────────────────────────────────
-- 6. TIEMPO REAL (avisar a los dispositivos conectados ante cambios)
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE canciones;
ALTER PUBLICATION supabase_realtime ADD TABLE programaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE responsables_programacion;
ALTER PUBLICATION supabase_realtime ADD TABLE tipos_programacion;

-- Al borrar una fila, enviar la fila completa (no solo el id)
ALTER TABLE canciones REPLICA IDENTITY FULL;
ALTER TABLE programaciones REPLICA IDENTITY FULL;
ALTER TABLE responsables_programacion REPLICA IDENTITY FULL;
ALTER TABLE tipos_programacion REPLICA IDENTITY FULL;


-- ─────────────────────────────────────────────────────────────────
-- 7. DATOS INICIALES
-- ─────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('admin', 'Acceso total a todos los módulos'),
  ('miembro_alabanza', 'Miembro del equipo de alabanza — crea y gestiona sus propias canciones'),
  ('miembro_nuevo', 'Usuario recién registrado — sin acceso, pendiente de promoción por un administrador'),
  ('gestor_alabanza', 'Gestor del equipo de alabanza — administra programaciones y asigna responsables');

INSERT INTO tipos_programacion (nombre) VALUES ('Aseo'), ('Sonido');


-- ─────────────────────────────────────────────────────────────────
-- 8. LIMPIEZA AUTOMÁTICA (opcional — requiere la extensión pg_cron)
-- ─────────────────────────────────────────────────────────────────
-- Para activar el borrado semanal de responsables antiguos, habilita
-- la extensión pg_cron en Database > Extensions y luego ejecuta:
--
-- SELECT cron.schedule(
--   'limpiar-responsables-antiguos',
--   '0 3 * * 0',
--   'SELECT limpiar_responsables_antiguos()'
-- );
