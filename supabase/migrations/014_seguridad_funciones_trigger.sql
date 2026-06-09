-- Fijar search_path y revocar ejecución en funciones trigger de la migración 013
-- Los triggers se ejecutan independientemente de permisos EXECUTE

-- 1. Recrear funciones con SET search_path = public

CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS trigger AS $$
BEGIN
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by, NEW.user_id);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- 2. Revocar ejecución desde todos los roles (los triggers no la necesitan)

REVOKE EXECUTE ON FUNCTION set_updated_by() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION propagar_actualizacion_cancion() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION propagar_actualizacion_cancion_desde_nota() FROM public, anon, authenticated;
