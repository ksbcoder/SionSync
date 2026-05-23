import { supabase } from './supabase';
import type { UsuarioConRol, RoleName } from '../domain';

export const usuarioRepository = {
  async getAll(): Promise<UsuarioConRol[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (profilesError) throw new Error(profilesError.message);

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*, roles(name, description)');
    if (rolesError) throw new Error(rolesError.message);

    return (profiles ?? []).map(profile => ({
      ...profile,
      user_roles: (userRoles ?? []).filter(ur => ur.user_id === profile.id),
    }));
  },

  async toggleActive(userId: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ active })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async getProfile(userId: string): Promise<{ display_name: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async changeRole(userId: string, newRole: RoleName): Promise<void> {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name');
    if (rolesError) throw new Error(rolesError.message);

    const roleRecord = roles?.find(r => r.name === newRole);
    if (!roleRecord) throw new Error(`Rol '${newRole}' no encontrado`);

    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('module', 'global');
    if (deleteError) throw new Error(deleteError.message);

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleRecord.id, module: 'global' });
    if (insertError) throw new Error(insertError.message);
  },
};
