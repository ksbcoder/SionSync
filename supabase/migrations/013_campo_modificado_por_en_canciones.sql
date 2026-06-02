-- Agregar campo updated_by para rastrear quién hizo la última modificación
ALTER TABLE canciones ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Llenar registros existentes con el creador original
UPDATE canciones SET updated_by = user_id;

ALTER TABLE canciones ALTER COLUMN updated_by SET NOT NULL;

-- Trigger: auto-setear updated_by y updated_at en cada INSERT/UPDATE de canciones
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS trigger AS $$
BEGIN
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by, NEW.user_id);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_canciones_set_updated_by
  BEFORE INSERT OR UPDATE ON canciones
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

-- Propagar modificaciones de secciones al padre (canciones)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_secciones_propagar
  AFTER INSERT OR UPDATE OR DELETE ON secciones
  FOR EACH ROW
  EXECUTE FUNCTION propagar_actualizacion_cancion();

-- Propagar modificaciones de notas al padre (canciones, a través de secciones)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notas_propagar
  AFTER INSERT OR UPDATE OR DELETE ON notas
  FOR EACH ROW
  EXECUTE FUNCTION propagar_actualizacion_cancion_desde_nota();
