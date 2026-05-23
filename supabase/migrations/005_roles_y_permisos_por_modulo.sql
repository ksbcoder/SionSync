-- Tabla de roles del sistema
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Roles iniciales
INSERT INTO roles (name, description) VALUES
  ('admin', 'Acceso total a todos los módulos'),
  ('miembro_alabanza', 'Miembro del equipo de alabanza — crea y gestiona sus propias canciones'),
  ('miembro_iglesia', 'Miembro de la iglesia — acceso de lectura y futuras funcionalidades');

-- Tabla de asignación de roles por módulo
-- module: 'global' aplica a todo, 'canciones' solo al módulo de canciones, etc.
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module TEXT NOT NULL DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, module)
);

-- RLS para roles y user_roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read user_roles"
  ON user_roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage user_roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.module = 'global'
    )
  );

-- Función helper: verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name = 'admin'
    AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función helper: verificar si puede crear canciones (admin o miembro_alabanza)
CREATE OR REPLACE FUNCTION can_create_canciones(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'miembro_alabanza')
    AND (ur.module = 'global' OR ur.module = 'canciones')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas de canciones
DROP POLICY IF EXISTS "Users can CRUD own canciones" ON canciones;

-- Todos los autenticados pueden leer
CREATE POLICY "Authenticated can read canciones"
  ON canciones FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo miembros de alabanza y admin pueden crear (sus propias)
CREATE POLICY "Alabanza or admin can insert canciones"
  ON canciones FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND can_create_canciones(auth.uid())
  );

-- Solo el dueño o admin pueden editar
CREATE POLICY "Owner or admin can update canciones"
  ON canciones FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Solo el dueño o admin pueden eliminar
CREATE POLICY "Owner or admin can delete canciones"
  ON canciones FOR DELETE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Políticas de secciones
DROP POLICY IF EXISTS "Users can CRUD own secciones" ON secciones;

CREATE POLICY "Authenticated can read secciones"
  ON secciones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owner or admin can insert secciones"
  ON secciones FOR INSERT
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Owner or admin can update secciones"
  ON secciones FOR UPDATE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Owner or admin can delete secciones"
  ON secciones FOR DELETE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- Políticas de notas
DROP POLICY IF EXISTS "Users can CRUD own notas" ON notas;

CREATE POLICY "Authenticated can read notas"
  ON notas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owner or admin can insert notas"
  ON notas FOR INSERT
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

CREATE POLICY "Owner or admin can update notas"
  ON notas FOR UPDATE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

CREATE POLICY "Owner or admin can delete notas"
  ON notas FOR DELETE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = auth.uid()
    )
    OR is_admin(auth.uid())
  );

-- Asignar rol admin al usuario existente
INSERT INTO user_roles (user_id, role_id, module)
SELECT
  '188f4da4-c2ea-4a56-8c8b-ce734d1ea3f2',
  id,
  'global'
FROM roles WHERE name = 'admin';

-- Trigger: asignar rol miembro_iglesia por defecto a nuevos usuarios
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, module)
  SELECT NEW.id, id, 'global'
  FROM roles WHERE name = 'miembro_iglesia';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();
