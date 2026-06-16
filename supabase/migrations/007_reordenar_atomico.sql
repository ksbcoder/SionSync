-- =====================================================================
-- SionSync — Migración: reordenar en bloque (atómico)
-- ---------------------------------------------------------------------
-- Antes, al mover una sección o una canción de una sesión, la app mandaba
-- un UPDATE por cada fila, en paralelo. Si uno fallaba a mitad (corte de
-- red, etc.), el orden quedaba inconsistente: dos elementos con números
-- cruzados.
--
-- Estas funciones reciben TODA la nueva numeración de una vez (un arreglo
-- JSON de { id, orden }) y la aplican en una sola sentencia. Al ser una
-- función, corre dentro de una transacción: o se actualizan todas las
-- filas o ninguna. Nunca queda a medias.
--
-- SECURITY INVOKER (lo de por defecto): la función corre con los permisos
-- de quien la llama, así que sigue respetando las reglas de acceso (RLS)
-- de cada tabla. Solo reordena lo que ese usuario ya podía editar.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================

-- Reordena varias secciones de una canción de una sola vez.
-- `ordenes` es un JSON como: [{ "id": "uuid", "orden": 0 }, ...]
CREATE OR REPLACE FUNCTION reordenar_secciones(ordenes jsonb)
RETURNS void AS $$
BEGIN
  UPDATE secciones AS s
  SET orden = (o->>'orden')::int
  FROM jsonb_array_elements(ordenes) AS o
  WHERE s.id = (o->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Reordena varias canciones dentro de una sesión de una sola vez.
-- `ordenes` es un JSON como: [{ "id": "uuid", "orden": 0 }, ...]
CREATE OR REPLACE FUNCTION reordenar_sesion_canciones(ordenes jsonb)
RETURNS void AS $$
BEGIN
  UPDATE sesion_canciones AS sc
  SET orden = (o->>'orden')::int
  FROM jsonb_array_elements(ordenes) AS o
  WHERE sc.id = (o->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Que el cliente (usuarios autenticados) pueda invocarlas vía RPC.
GRANT EXECUTE ON FUNCTION reordenar_secciones(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION reordenar_sesion_canciones(jsonb) TO authenticated;
