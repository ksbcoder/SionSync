-- Revocar ejecución de funciones trigger desde cualquier rol
-- Los triggers se ejecutan independientemente de permisos EXECUTE
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION assign_default_role() FROM authenticated;

-- Cambiar funciones helper de RLS a SECURITY INVOKER
-- Solo leen de tablas que los usuarios autenticados ya pueden consultar vía RLS
-- Esto elimina el warning de SECURITY DEFINER sin romper las políticas

CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name = 'admin'
    AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_create_canciones(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'miembro_alabanza')
    AND (ur.module = 'global' OR ur.module = 'canciones')
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

-- Revocar ejecución desde anon y public para todas las funciones SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION is_admin(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION can_create_canciones(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM public, anon;
REVOKE EXECUTE ON FUNCTION assign_default_role() FROM public, anon;
