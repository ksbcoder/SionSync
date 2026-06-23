-- =====================================================================
-- SionSync — Migración 004 (descripciones y secciones simultáneas)
-- ---------------------------------------------------------------------
-- Tres cambios:
--
-- 1) canciones.descripcion: texto opcional para describir la canción
--    (contexto, notas generales, etc.).
--
-- 2) secciones.descripcion: texto opcional para describir cada sección.
--
-- 3) secciones.grupo_simultaneo: agrupa secciones que se cantan AL MISMO
--    TIEMPO. Las secciones que comparten el mismo valor de grupo_simultaneo
--    forman un grupo simultáneo (p. ej. dos coros que suenan a la vez).
--    Es opcional: si está vacío (NULL), la sección no es simultánea con
--    ninguna. Soporta grupos de 2 o más secciones.
--
-- Nota: 'autor' en canciones YA es opcional en la base (acepta NULL); no
-- requiere cambios aquí. Hacerlo opcional es solo en el formulario del front.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- Va DESPUÉS de 001, 002 y 003.
-- =====================================================================

-- 1) Descripción opcional de la canción
ALTER TABLE canciones
  ADD COLUMN IF NOT EXISTS descripcion text;

-- 2) Descripción opcional de la sección
ALTER TABLE secciones
  ADD COLUMN IF NOT EXISTS descripcion text;

-- 3) Grupo de secciones simultáneas (las que comparten valor se cantan a la vez)
ALTER TABLE secciones
  ADD COLUMN IF NOT EXISTS grupo_simultaneo uuid;

-- Índice para buscar/agrupar rápido las secciones de un mismo grupo simultáneo
CREATE INDEX IF NOT EXISTS idx_secciones_grupo_simultaneo
  ON secciones(grupo_simultaneo)
  WHERE grupo_simultaneo IS NOT NULL;
