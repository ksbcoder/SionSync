-- Fijar search_path en todas las funciones para evitar manipulación de schema

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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

CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, module)
  SELECT NEW.id, id, 'global'
  FROM roles WHERE name = 'miembro_iglesia';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name = 'admin'
    AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_create_canciones(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'miembro_alabanza')
    AND (ur.module = 'global' OR ur.module = 'canciones')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Revocar ejecución pública de funciones SECURITY DEFINER
-- Solo usuarios autenticados deben poder ejecutarlas
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION assign_default_role() FROM public;
REVOKE EXECUTE ON FUNCTION is_admin(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION can_create_canciones(UUID) FROM public;
