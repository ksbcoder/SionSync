import { supabase } from './supabase';
import type { Profile, UsuarioConRol, RoleName } from '../domain';

export const usuarioRepository = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getProfilesByIds(userIds: string[]): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getRolesByUser(userId: string): Promise<RoleName[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    // La relación 'roles' llega como objeto anidado, aunque los tipos generados
    // por Supabase a veces la describen como arreglo: normalizamos ambos casos.
    type FilaRol = { roles: { name: RoleName } | { name: RoleName }[] | null };
    const filas = (data ?? []) as unknown as FilaRol[];
    return filas
      .map(ur => (Array.isArray(ur.roles) ? ur.roles[0]?.name : ur.roles?.name))
      .filter((name): name is RoleName => Boolean(name));
  },

  async updateConsent(userId: string, version: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        data_consent_at: new Date().toISOString(),
        data_consent_version: version,
      })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async getAll(): Promise<UsuarioConRol[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name', { ascending: true });
    if (profilesError) throw new Error(profilesError.message);

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*, roles(name, description)');
    if (rolesError) throw new Error(rolesError.message);

    return (profiles ?? [])
      .map(profile => ({
        ...profile,
        user_roles: (userRoles ?? []).filter(ur => ur.user_id === profile.id),
      }))
      .sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''));
  },

  async toggleActive(userId: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ active })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);
    if (error) throw new Error(error.message);
    await supabase.auth.updateUser({ data: { full_name: displayName } });
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
