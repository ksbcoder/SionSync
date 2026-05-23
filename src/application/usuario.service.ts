import { usuarioRepository } from '../infrastructure/usuario.repository';
import type { UsuarioConRol, RoleName } from '../domain';

export const usuarioService = {
  getAll: (): Promise<UsuarioConRol[]> => usuarioRepository.getAll(),
  getProfile: (userId: string) => usuarioRepository.getProfile(userId),
  updateDisplayName: (userId: string, displayName: string) => usuarioRepository.updateDisplayName(userId, displayName),
  toggleActive: (userId: string, active: boolean): Promise<void> => usuarioRepository.toggleActive(userId, active),
  changeRole: (userId: string, newRole: RoleName): Promise<void> => usuarioRepository.changeRole(userId, newRole),
};
