-- Renombrar el rol por defecto: miembro_iglesia -> miembro_nuevo
-- El rol sigue funcionando igual (sin acceso a módulos); solo se actualiza la etiqueta
-- para reflejar mejor su propósito: usuario recién registrado pendiente de promoción.

UPDATE roles
SET
  name = 'miembro_nuevo',
  description = 'Usuario recién registrado — sin acceso, pendiente de promoción por un administrador'
WHERE name = 'miembro_iglesia';

-- Recrear la función que asigna el rol por defecto a nuevos usuarios para que
-- referencie el nuevo nombre del rol.
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_id, module)
  SELECT NEW.id, id, 'global'
  FROM roles WHERE name = 'miembro_nuevo';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
