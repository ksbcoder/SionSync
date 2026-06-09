-- Índice en FK user_roles.role_id (Performance Advisor)

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
