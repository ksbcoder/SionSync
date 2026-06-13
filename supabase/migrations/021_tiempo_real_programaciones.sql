-- =============================================
-- 021: Tiempo real para programaciones y canciones
-- =============================================
-- Permite que la base de datos avise a todos los dispositivos conectados
-- cuando cambian estos datos, para que ninguno se quede viendo información
-- vieja mientras otro la actualiza.

-- =========================
-- 1. Publicar los cambios de las tablas en el canal de tiempo real
-- =========================
ALTER PUBLICATION supabase_realtime ADD TABLE programaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE responsables_programacion;
ALTER PUBLICATION supabase_realtime ADD TABLE tipos_programacion;
ALTER PUBLICATION supabase_realtime ADD TABLE canciones;

-- =========================
-- 2. Incluir los datos completos de la fila al eliminar
-- =========================
-- Sin esto, un evento de borrado solo trae el id; con REPLICA IDENTITY FULL
-- llega la fila entera, lo que da más margen por si luego se quiere filtrar.
ALTER TABLE programaciones REPLICA IDENTITY FULL;
ALTER TABLE responsables_programacion REPLICA IDENTITY FULL;
ALTER TABLE tipos_programacion REPLICA IDENTITY FULL;
ALTER TABLE canciones REPLICA IDENTITY FULL;
