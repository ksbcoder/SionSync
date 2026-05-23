-- Asignar usuario existente a canciones sin dueño
UPDATE canciones SET user_id = '188f4da4-c2ea-4a56-8c8b-ce734d1ea3f2' WHERE user_id IS NULL;

-- Forzar que toda canción tenga dueño
ALTER TABLE canciones ALTER COLUMN user_id SET NOT NULL;
