-- Índices en foreign keys sin cobertura (Performance Advisor)

CREATE INDEX IF NOT EXISTS idx_canciones_user_id ON canciones(user_id);
CREATE INDEX IF NOT EXISTS idx_canciones_updated_by ON canciones(updated_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
