-- Campo para activar/desactivar usuarios
ALTER TABLE profiles ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Permitir que admins puedan actualizar cualquier perfil (activar/desactivar)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Permitir que admins puedan leer los roles de usuario para gestión
CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.module = 'global'
    )
  );

CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
      AND ur.module = 'global'
    )
  );
