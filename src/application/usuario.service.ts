import { usuarioRepository } from '../infrastructure/usuario.repository';
import type { UsuarioConRol, RoleName } from '../domain';

export const usuarioService = {
  getAll: (): Promise<UsuarioConRol[]> => usuarioRepository.getAll(),
  toggleActive: (userId: string, active: boolean): Promise<void> => usuarioRepository.toggleActive(userId, active),
  changeRole: (userId: string, newRole: RoleName): Promise<void> => usuarioRepository.changeRole(userId, newRole),
};
