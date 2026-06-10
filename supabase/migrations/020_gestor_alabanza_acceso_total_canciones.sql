-- Otorgar al rol gestor_alabanza los mismos permisos que admin sobre canciones,
-- secciones y notas (crear, editar y eliminar cualquier registro, no solo los propios).

-- ============================================
-- Helper: puede gestionar canciones (admin o gestor_alabanza)
-- ============================================
CREATE OR REPLACE FUNCTION can_gestionar_canciones(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'gestor_alabanza')
    AND ur.module = 'global'
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

REVOKE EXECUTE ON FUNCTION can_gestionar_canciones(UUID) FROM public, anon;

-- ============================================
-- Ampliar can_create_canciones para incluir gestor_alabanza
-- ============================================
CREATE OR REPLACE FUNCTION can_create_canciones(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = check_user_id
    AND r.name IN ('admin', 'miembro_alabanza', 'gestor_alabanza')
    AND (ur.module = 'global' OR ur.module = 'canciones')
  );
$$ LANGUAGE sql SECURITY INVOKER STABLE SET search_path = public;

-- ============================================
-- canciones: el gestor también edita y elimina cualquiera
-- ============================================
DROP POLICY IF EXISTS "Owner or admin can update canciones" ON canciones;
DROP POLICY IF EXISTS "Owner or admin can delete canciones" ON canciones;

CREATE POLICY "Owner gestor or admin can update canciones"
  ON canciones FOR UPDATE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

CREATE POLICY "Owner gestor or admin can delete canciones"
  ON canciones FOR DELETE
  USING ((select auth.uid()) = user_id OR can_gestionar_canciones((select auth.uid())));

-- ============================================
-- secciones: idem
-- ============================================
DROP POLICY IF EXISTS "Owner or admin can insert secciones" ON secciones;
DROP POLICY IF EXISTS "Owner or admin can update secciones" ON secciones;
DROP POLICY IF EXISTS "Owner or admin can delete secciones" ON secciones;

CREATE POLICY "Owner gestor or admin can insert secciones"
  ON secciones FOR INSERT
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update secciones"
  ON secciones FOR UPDATE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  )
  WITH CHECK (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can delete secciones"
  ON secciones FOR DELETE
  USING (
    cancion_id IN (SELECT id FROM canciones WHERE user_id = (select auth.uid()))
    OR can_gestionar_canciones((select auth.uid()))
  );

-- ============================================
-- notas: idem
-- ============================================
DROP POLICY IF EXISTS "Owner or admin can insert notas" ON notas;
DROP POLICY IF EXISTS "Owner or admin can update notas" ON notas;
DROP POLICY IF EXISTS "Owner or admin can delete notas" ON notas;

CREATE POLICY "Owner gestor or admin can insert notas"
  ON notas FOR INSERT
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can update notas"
  ON notas FOR UPDATE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  )
  WITH CHECK (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );

CREATE POLICY "Owner gestor or admin can delete notas"
  ON notas FOR DELETE
  USING (
    seccion_id IN (
      SELECT s.id FROM secciones s
      JOIN canciones c ON c.id = s.cancion_id
      WHERE c.user_id = (select auth.uid())
    )
    OR can_gestionar_canciones((select auth.uid()))
  );
