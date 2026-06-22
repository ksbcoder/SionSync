-- =====================================================================
-- SionSync — Migración 003 (no borrar programaciones con responsables)
-- ---------------------------------------------------------------------
-- Antes, al eliminar una programación se borraban en cascada todos sus
-- responsables (ON DELETE CASCADE). Ahora la base IMPIDE eliminar una
-- programación que tenga responsables asignados: hay que quitarlos primero
-- o, mejor, simplemente inactivar la programación.
--
-- Cambiamos la llave foránea de responsables_programacion → programaciones
-- de CASCADE a RESTRICT. Si se intenta borrar una programación con
-- responsables, la base devuelve el error 23503 (violación de llave foránea)
-- y la app lo traduce a un mensaje claro.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- Va DESPUÉS de 001 y 002.
-- =====================================================================

ALTER TABLE responsables_programacion
  DROP CONSTRAINT IF EXISTS responsables_programacion_programacion_id_fkey;

ALTER TABLE responsables_programacion
  ADD CONSTRAINT responsables_programacion_programacion_id_fkey
  FOREIGN KEY (programacion_id) REFERENCES programaciones(id) ON DELETE RESTRICT;
