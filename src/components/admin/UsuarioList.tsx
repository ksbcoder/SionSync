import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, ShieldCheck, ShieldX, UserCheck, UserX } from 'lucide-react';
import { usuarioRepository } from '../../infrastructure/usuario.repository';
import { useAuth } from '../../hooks/useAuth';
import { BottomSheet } from '../layout/BottomSheet';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { DotLoader } from '../ui/DotLoader';
import { ROLES_INFO } from '../../domain';
import type { UsuarioConRol, RoleName } from '../../domain';

function getRolActual(usuario: UsuarioConRol): RoleName {
  const roles = usuario.user_roles
    ?.map(ur => ur.roles?.name)
    .filter(Boolean) as RoleName[] ?? [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('gestor_alabanza')) return 'gestor_alabanza';
  if (roles.includes('miembro_alabanza')) return 'miembro_alabanza';
  return 'miembro_nuevo';
}

export function UsuarioList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UsuarioConRol | null>(null);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<UsuarioConRol | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const data = await usuarioRepository.getAll();
    setUsuarios(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleChangeRole = async (newRole: RoleName) => {
    if (!selectedUser) return;
    setSaving(true);
    await usuarioRepository.changeRole(selectedUser.id, newRole);
    setRoleSheetOpen(false);
    setSelectedUser(null);
    setSaving(false);
    await cargar();
  };

  const handleToggleActive = async () => {
    if (!confirmToggle) return;
    setSaving(true);
    await usuarioRepository.toggleActive(confirmToggle.id, !confirmToggle.active);
    setConfirmToggle(null);
    setSaving(false);
    await cargar();
  };

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 flex items-center gap-2 px-4 py-3 z-10">
        <button onClick={() => navigate('/administracion')} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h1>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <DotLoader text="Cargando usuarios..." />
        ) : (
          <div className="flex flex-col gap-3">
            {usuarios.map(usuario => {
              const rol = getRolActual(usuario);
              const rolInfo = ROLES_INFO[rol];
              const esMismo = usuario.id === currentUser?.id;

              return (
                <div
                  key={usuario.id}
                  className={`bg-white rounded-xl border p-4 ${usuario.active ? 'border-gray-200' : 'border-red-200 bg-red-50/30'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 truncate">{usuario.display_name}</p>
                        {!usuario.active && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">Inactivo</span>
                        )}
                      </div>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${rolInfo.color}`}>
                        {rolInfo.label}
                      </span>
                    </div>

                    {!esMismo && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setSelectedUser(usuario); setRoleSheetOpen(true); }}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Cambiar rol"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(usuario)}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors ${
                            usuario.active
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={usuario.active ? 'Desactivar' : 'Activar'}
                        >
                          {usuario.active ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                      </div>
                    )}

                    {esMismo && (
                      <span className="text-xs text-slate-400 italic shrink-0">Tú</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomSheet
        isOpen={roleSheetOpen}
        onClose={() => { setRoleSheetOpen(false); setSelectedUser(null); }}
        title={`Rol de ${selectedUser?.display_name ?? ''}`}
      >
        <div className="flex flex-col gap-2">
          {(Object.entries(ROLES_INFO) as [RoleName, typeof ROLES_INFO[RoleName]][]).map(([key, info]) => {
            const isCurrentRole = selectedUser ? getRolActual(selectedUser) === key : false;
            return (
              <button
                key={key}
                onClick={() => !isCurrentRole && handleChangeRole(key)}
                disabled={saving || isCurrentRole}
                className={`w-full text-left p-4 rounded-xl transition-colors ${
                  isCurrentRole
                    ? 'bg-brand-50 border-2 border-brand-300'
                    : 'hover:bg-gray-50 border border-gray-200'
                } ${saving ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {isCurrentRole ? <ShieldCheck className="w-5 h-5 text-brand-700" /> : <ShieldX className="w-5 h-5 text-gray-300" />}
                  <span className="font-medium text-gray-800">{info.label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-7">{info.description}</p>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <ConfirmSheet
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggleActive}
        title={confirmToggle?.active ? '¿Desactivar este usuario?' : '¿Activar este usuario?'}
        description={
          confirmToggle?.active
            ? `${confirmToggle.display_name} no podrá acceder a la aplicación hasta que lo reactives.`
            : `${confirmToggle?.display_name} podrá acceder nuevamente a la aplicación.`
        }
        confirmLabel={confirmToggle?.active ? 'Desactivar' : 'Activar'}
        variant={confirmToggle?.active ? 'danger' : 'success'}
      />
    </div>
  );
}
