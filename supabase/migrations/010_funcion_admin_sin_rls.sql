-- Función que bypasea RLS para verificar admin (usada en políticas de user_roles)
-- Debe ser plpgsql para evitar inlining y preservar SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin_no_rls(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name = 'admin'
    AND ur.module = 'global'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Solo authenticated puede ejecutar (necesario para que las políticas RLS funcionen)
REVOKE EXECUTE ON FUNCTION is_admin_no_rls(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION is_admin_no_rls(UUID) TO authenticated;

-- Reemplazar políticas de user_roles para usar is_admin_no_rls (evita recursión infinita)
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;

CREATE POLICY "Admins can manage user_roles"
  ON user_roles FOR ALL
  USING (is_admin_no_rls(auth.uid()));

CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_admin_no_rls(auth.uid()));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (is_admin_no_rls(auth.uid()));
