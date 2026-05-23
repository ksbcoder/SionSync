export interface Profile {
  id: string;
  display_name: string;
  active: boolean;
  created_at: string;
  data_consent_at: string | null;
  data_consent_version: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  module: string;
  created_at: string;
  roles: { name: string; description: string } | null;
}

export interface UsuarioConRol extends Profile {
  user_roles: UserRole[];
}

export type RoleName = 'admin' | 'miembro_alabanza' | 'miembro_iglesia';

export const ROLES_INFO: Record<RoleName, { label: string; description: string; color: string }> = {
  admin: { label: 'Administrador', description: 'Acceso total', color: 'bg-red-100 text-red-800' },
  miembro_alabanza: { label: 'Miembro de Alabanza', description: 'Gestiona canciones', color: 'bg-amber-100 text-amber-800' },
  miembro_iglesia: { label: 'Miembro de Iglesia', description: 'Acceso de lectura', color: 'bg-blue-100 text-blue-800' },
};
