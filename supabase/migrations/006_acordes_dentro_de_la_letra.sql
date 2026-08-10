-- =====================================================================
-- SionSync — Migración 006 (acordes dentro de la letra)
-- ---------------------------------------------------------------------
-- Hasta ahora los acordes vivían en su propia tabla `notas`, atados a la
-- sección pero sin saber sobre qué palabra sonaban. Por eso se mostraban
-- como fichas sueltas encima de la sección.
--
-- A partir de ahora los acordes van incrustados en la propia letra, justo
-- antes de la sílaba donde suenan, con el formato estándar ChordPro:
--
--     [Am]Me rin[C]do
--
-- Así el acorde viaja pegado a su lugar y ya no hace falta una tabla
-- aparte. Esta migración elimina por completo la infraestructura de
-- `notas`: su trigger de auditoría, la función que lo alimentaba, la
-- tabla (con su índice y sus permisos) y el permiso de la función.
--
-- Los acordes que existían se descartan (empezamos de cero); la letra de
-- cada sección se conserva intacta.
--
-- Cómo aplicarla: pégala en Supabase > SQL Editor y dale Run.
-- Va DESPUÉS de 001, 002, 003, 004 y 005.
-- =====================================================================

-- 1. Quitar el trigger que propagaba la auditoría desde las notas.
DROP TRIGGER IF EXISTS trg_notas_propagar ON notas;

-- 2. Quitar la función que usaba ese trigger (ya nadie más la llama).
DROP FUNCTION IF EXISTS propagar_actualizacion_cancion_desde_nota();

-- 3. Quitar la tabla. CASCADE se lleva con ella su índice
--    (idx_notas_seccion_id) y sus políticas de acceso (RLS).
DROP TABLE IF EXISTS notas CASCADE;
