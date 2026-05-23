-- Schema interno no expuesto por PostgREST
CREATE SCHEMA IF NOT EXISTS internal;
GRANT USAGE ON SCHEMA internal TO authenticated;

-- Función que bypasea RLS para verificar admin (usada en políticas de user_roles)
-- Debe ser plpgsql para evitar inlining y preservar SECURITY DEFINER
-- Vive en schema internal para no ser invocable via API REST
CREATE OR REPLACE FUNCTION internal.is_admin_no_rls(check_user_id UUID)
RETURNS BOOLEAN AS $$
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

REVOKE EXECUTE ON FUNCTION internal.is_admin_no_rls(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION internal.is_admin_no_rls(UUID) TO authenticated;

-- Reemplazar políticas de user_roles para usar internal.is_admin_no_rls
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;

CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (internal.is_admin_no_rls(auth.uid()));

CREATE POLICY "Admins can update user_roles"
  ON user_roles FOR UPDATE
  USING (internal.is_admin_no_rls(auth.uid()))
  WITH CHECK (internal.is_admin_no_rls(auth.uid()));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (internal.is_admin_no_rls(auth.uid()));
