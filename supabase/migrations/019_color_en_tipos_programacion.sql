-- Agregar color a los tipos de programación para distinguirlos visualmente
-- (puntos en el selector de fecha, indicador en la tarjeta de programación, etc.)

ALTER TABLE tipos_programacion
  ADD COLUMN color TEXT NOT NULL DEFAULT '#6366f1';
