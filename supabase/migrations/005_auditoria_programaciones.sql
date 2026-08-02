-- =====================================================================
-- SionSync — Migración 005 (auditoría de programaciones)
-- ---------------------------------------------------------------------
-- Hasta ahora la programación solo registraba "quién modificó y cuándo"
-- (updated_by / updated_at) cuando se cambiaba la programación en sí
-- (activarla o desactivarla). Si alguien asignaba, quitaba o marcaba como
-- notificado a un responsable, la auditoría no se movía.
--
-- Con esta migración cualquier cambio en los responsables de una
-- programación actualiza también la auditoría de la programación padre,
-- igual que ya pasa en las canciones cuando se tocan sus secciones o
-- acordes. Quién hizo el cambio lo pone el trigger que ya existe
-- (trg_programaciones_set_updated_by) a partir del usuario de la sesión.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- Va DESPUÉS de 001, 002, 003 y 004.
-- =====================================================================

-- Propaga al padre (programaciones) los cambios hechos en sus responsables
CREATE OR REPLACE FUNCTION propagar_actualizacion_programacion()
RETURNS trigger AS $$
DECLARE
  v_programacion_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_programacion_id := OLD.programacion_id;
  ELSE
    v_programacion_id := NEW.programacion_id;
  END IF;
  UPDATE programaciones SET updated_at = now() WHERE id = v_programacion_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION propagar_actualizacion_programacion() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_responsables_propagar ON responsables_programacion;
CREATE TRIGGER trg_responsables_propagar
  AFTER INSERT OR UPDATE OR DELETE ON responsables_programacion
  FOR EACH ROW EXECUTE FUNCTION propagar_actualizacion_programacion();
