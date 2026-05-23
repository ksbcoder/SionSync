-- Agregar columna user_id a canciones
ALTER TABLE canciones ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Eliminar políticas públicas del MVP
DROP POLICY IF EXISTS "Acceso público canciones" ON canciones;
DROP POLICY IF EXISTS "Acceso público secciones" ON secciones;
DROP POLICY IF EXISTS "Acceso público notas" ON notas;

-- Política: cada usuario solo ve/modifica sus canciones
CREATE POLICY "Users can CRUD own canciones"
  ON canciones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Secciones: acceso basado en la canción del usuario
CREATE POLICY "Users can CRUD own secciones"
  ON secciones FOR ALL
  USING (cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid()))
  WITH CHECK (cancion_id IN (SELECT id FROM canciones WHERE user_id = auth.uid()));

-- Notas: acceso basado en la sección -> canción del usuario
CREATE POLICY "Users can CRUD own notas"
  ON notas FOR ALL
  USING (seccion_id IN (
    SELECT s.id FROM secciones s
    JOIN canciones c ON c.id = s.cancion_id
    WHERE c.user_id = auth.uid()
  ))
  WITH CHECK (seccion_id IN (
    SELECT s.id FROM secciones s
    JOIN canciones c ON c.id = s.cancion_id
    WHERE c.user_id = auth.uid()
  ));
