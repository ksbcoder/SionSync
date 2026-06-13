-- =====================================================================
-- SionSync — Migración: relación directa responsables → profiles
-- ---------------------------------------------------------------------
-- Hasta ahora 'responsables_programacion' solo apuntaba a auth.users, así
-- que para mostrar los nombres había que hacer una SEGUNDA consulta a
-- 'profiles'. Eso sumaba latencia (dos viajes a la base por cada carga).
--
-- Agregamos relaciones (FK) de 'user_id' y 'asignado_por' hacia
-- 'profiles(id)'. Con ellas, la app puede traer el responsable y su nombre
-- (y el de quien asignó) en UNA sola consulta, embebiendo 'profiles'.
--
-- Nota: 'profiles.id' ya es la misma identidad que 'auth.users.id' (se crea
-- un profile por cada usuario), así que toda fila existente ya cumple.
--
-- IMPORTANTE: corre esta migración ANTES de desplegar el frontend nuevo,
-- porque la nueva consulta depende de estas relaciones.
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- =====================================================================

-- Relación del responsable (quién está asignado) con su perfil.
ALTER TABLE responsables_programacion
  DROP CONSTRAINT IF EXISTS responsables_programacion_user_id_profiles_fkey;
ALTER TABLE responsables_programacion
  ADD CONSTRAINT responsables_programacion_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Relación de quien asignó con su perfil.
ALTER TABLE responsables_programacion
  DROP CONSTRAINT IF EXISTS responsables_programacion_asignado_por_profiles_fkey;
ALTER TABLE responsables_programacion
  ADD CONSTRAINT responsables_programacion_asignado_por_profiles_fkey
  FOREIGN KEY (asignado_por) REFERENCES profiles(id) ON DELETE CASCADE;
