-- Tabla canciones
CREATE TABLE canciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor text,
  tonalidad text,
  tempo integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla secciones
CREATE TABLE secciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cancion_id uuid NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('verso', 'coro', 'pre-coro', 'puente', 'intro', 'outro', 'final', 'otro')),
  orden integer NOT NULL DEFAULT 0,
  letra text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Tabla notas
CREATE TABLE notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seccion_id uuid NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_secciones_cancion_id ON secciones(cancion_id);
CREATE INDEX idx_notas_seccion_id ON notas(seccion_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_canciones_updated_at
  BEFORE UPDATE ON canciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Políticas RLS (acceso público para MVP)
ALTER TABLE canciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público canciones" ON canciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público secciones" ON secciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público notas" ON notas FOR ALL USING (true) WITH CHECK (true);
