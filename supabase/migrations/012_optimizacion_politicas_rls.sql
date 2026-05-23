-- =============================================================
-- Optimización de políticas RLS
-- 1. Reemplazar auth.role()/auth.uid() con (select ...) para
--    que se evalúen una sola vez por query en lugar de por fila
-- 2. Unificar políticas múltiples del mismo tipo en una sola
-- =============================================================

-- =====================
-- profiles
-- =====================
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Authenticated can read profiles"
  ON profiles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner or admin can update profiles"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = id OR is_admin((select auth.uid())));

-- =====================
-- roles
-- =====================
DROP POLICY IF EXISTS "Authenticated can read roles" ON roles;

CREATE POLICY "Authenticated can read roles"
  ON roles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- =====================
-- user_roles
-- =====================
DROP POLICY IF EXISTS "Authenticated can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;

CREATE POLICY "Authenticated can read user_roles"
  ON user_roles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (internal.is_admin_no_rls((select auth.uid())));

CREATE POLICY "Admins can update user_roles"
  ON user_roles FOR UPDATE
  USING (internal.is_admin_no_rls((select auth.uid())))
  WITH CHECK (internal.is_admin_no_rls((select auth.uid())));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (internal.is_admin_no_rls((select auth.uid())));

-- =====================
-- canciones
-- =====================
DROP POLICY IF EXISTS "Authenticated can read canciones" ON canciones;
DROP POLICY IF EXISTS "Alabanza or admin can insert canciones" ON canciones;
DROP POLICY IF EXISTS "Owner or admin can update canciones" ON canciones;
DROP POLICY IF EXISTS "Owner or admin can delete canciones" ON canciones;

CREATE POLICY "Authenticated can read canciones"
  ON canciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Alabanza or admin can insert canciones"
  ON canciones FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND can_create_canciones((select auth.uid()))
  );

CREATE POLICY "Owner or admin can update canciones"
  ON canciones FOR UPDATE
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "Owner or admin can delete canciones"
  ON canciones FOR DELETE
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

-- =====================
-- secciones
-- =====================
DROP POLICY IF EXISTS "Authenticated can read secciones" ON secciones;
DROP POLICY IF EXISTS "Owner or admin can insert secciones" ON secciones;
DROP POLICY IF EXISTS "Owner or admin can update secciones" ON secciones;
DROP POLICY IF EXISTS "Owner or admin can delete secciones" ON secciones;

CREATE POLICY "Authenticated can read secciones"
  ON secciones FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner or admin can insert secciones"
  ON secciones FOR INSERT
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR is_admin((select auth.uid()))
  );

CREATE POLICY "Owner or admin can update secciones"
  ON secciones FOR UPDATE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR is_admin((select auth.uid()))
  )
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR is_admin((select auth.uid()))
  );

CREATE POLICY "Owner or admin can delete secciones"
  ON secciones FOR DELETE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR is_admin((select auth.uid()))
  );

-- =====================
-- notas
-- =====================
DROP POLICY IF EXISTS "Authenticated can read notas" ON notas;
DROP POLICY IF EXISTS "Owner or admin can insert notas" ON notas;
DROP POLICY IF EXISTS "Owner or admin can update notas" ON notas;
DROP POLICY IF EXISTS "Owner or admin can delete notas" ON notas;

CREATE POLICY "Authenticated can read notas"
  ON notas FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Owner or admin can insert notas"
  ON notas FOR INSERT
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR is_admin((select auth.uid()))
  );

CREATE POLICY "Owner or admin can update notas"
  ON notas FOR UPDATE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR is_admin((select auth.uid()))
  )
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR is_admin((select auth.uid()))
  );

CREATE POLICY "Owner or admin can delete notas"
  ON notas FOR DELETE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR is_admin((select auth.uid()))
  );
