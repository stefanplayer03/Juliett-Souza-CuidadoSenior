import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { UserProfile, UserRole, SECURITY_QUESTIONS } from '../types';
import {
  ShieldCheck,
  Shield,
  User,
  Users,
  UserPlus,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Lock,
  Mail,
  Phone,
  HelpCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  Settings as SettingsIcon
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    currentUser,
    usersList,
    registerUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPasswordByAdmin,
    isSuperAdmin,
  } = useAuth();

  const { settings, updateSettings } = useApp();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_first_setup'>('all');

  // Modal states
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);

  // Selected user for editing / resetting
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states - New / Edit User
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    phone: '',
    role: 'user' as UserRole,
    password: '',
    mustChangePassword: true,
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: '',
    isActive: true,
  });

  // Form states - Reset Password
  const [tempPassword, setTempPassword] = useState('');
  const [forceFirstAccess, setForceFirstAccess] = useState(true);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    // If logged in as Clinical Admin (role === 'admin'), only see users linked to this admin or themselves
    if (currentUser?.role === 'admin') {
      const isSelf = u.uid === currentUser.uid;
      const isLinked = u.adminId === currentUser.uid;
      if (!isSelf && !isLinked) return false;
    }

    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = u.isActive !== false;
    else if (statusFilter === 'inactive') matchesStatus = u.isActive === false;
    else if (statusFilter === 'pending_first_setup') matchesStatus = !!u.mustChangePassword;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open modal to add user
  const handleOpenNewUser = () => {
    setFormData({
      displayName: '',
      username: '',
      email: '',
      phone: '',
      role: 'user',
      password: 'Senha' + Math.floor(100 + Math.random() * 900),
      mustChangePassword: true,
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: 'resposta123',
      isActive: true,
    });
    setErrorMsg(null);
    setIsNewUserModalOpen(true);
  };

  // Open modal to edit user
  const handleOpenEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      mustChangePassword: !!user.mustChangePassword,
      securityQuestion: user.securityQuestion || SECURITY_QUESTIONS[0],
      securityAnswer: user.securityAnswer || '',
      isActive: user.isActive !== false,
    });
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Open modal to reset password
  const handleOpenResetPass = (user: UserProfile) => {
    setSelectedUser(user);
    setTempPassword('Temp@' + Math.floor(1000 + Math.random() * 9000));
    setForceFirstAccess(true);
    setErrorMsg(null);
    setIsResetPassModalOpen(true);
  };

  // Submit New User
  const handleSaveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.displayName.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      showError('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const res = await registerUser({
        adminId: currentUser?.role === 'admin' ? currentUser.uid : undefined,
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        password: formData.password,
        mustChangePassword: formData.mustChangePassword,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        isActive: formData.isActive,
      });

      if (!res.success) {
        showError(res.error || 'Erro ao cadastrar usuário.');
        return;
      }

      setIsNewUserModalOpen(false);
      showSuccess(`Usuário "${formData.username}" cadastrado com sucesso!`);
    } catch (err: any) {
      showError(err.message || 'Erro inesperado ao salvar.');
    }
  };

  // Submit Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg(null);

    try {
      const res = await updateUser(selectedUser.uid, {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        mustChangePassword: formData.mustChangePassword,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        isActive: formData.isActive,
      });

      if (!res.success) {
        showError(res.error || 'Erro ao atualizar usuário.');
        return;
      }

      setIsEditModalOpen(false);
      showSuccess(`Dados do usuário "${formData.username}" atualizados com sucesso!`);
    } catch (err: any) {
      showError(err.message || 'Erro ao atualizar.');
    }
  };

  // Submit Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!tempPassword || tempPassword.length < 6) {
      showError('A senha temporária deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const res = await resetUserPasswordByAdmin(selectedUser.uid, tempPassword, forceFirstAccess);
      if (!res.success) {
        showError(res.error || 'Erro ao redefinir senha.');
        return;
      }

      setIsResetPassModalOpen(false);
      showSuccess(`Senha do usuário "${selectedUser.username}" redefinida para "${tempPassword}". Exigência de troca no próximo login: ${forceFirstAccess ? 'SIM' : 'NÃO'}.`);
    } catch (err: any) {
      showError(err.message || 'Erro ao redefinir senha.');
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (user: UserProfile) => {
    try {
      const res = await toggleUserStatus(user.uid);
      if (!res.success) {
        showError(res.error || 'Não foi possível alterar o status do usuário.');
        return;
      }
      showSuccess(`Status do usuário "${user.username}" alterado com sucesso!`);
    } catch (err: any) {
      showError(err.message || 'Erro ao alterar status.');
    }
  };

  // Delete user
  const handleDelete = async (user: UserProfile) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${user.displayName}" (@${user.username})?`)) {
      return;
    }

    try {
      const res = await deleteUser(user.uid);
      if (!res.success) {
        showError(res.error || 'Não foi possível excluir o usuário.');
        return;
      }
      showSuccess(`Usuário "${user.username}" removido do sistema.`);
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir.');
    }
  };

  // Count metrics
  const totalCount = usersList.length;
  const superAdminCount = usersList.filter((u) => u.role === 'superadmin').length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;
  const caregiverCount = usersList.filter((u) => u.role === 'user').length;
  const pendingFirstSetupCount = usersList.filter((u) => u.mustChangePassword).length;

  return (
    <div className="space-y-6">
      {/* Top Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-[#BFE8D6]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-[#2F7E6A] text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-black text-[#1F2E2C]">
              Painel de Gestão de Usuários (Super ADMIN)
            </h2>
          </div>
          <p className="text-xs text-[#2F7E6A] font-semibold">
            Controle mestre de contas cadastradas, níveis de permissão, auditoria e recuperação de credenciais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAppSettingsOpen(true)}
            className="py-2.5 px-4 bg-white hover:bg-gray-50 text-[#1F2E2C] border-2 border-[#BFE8D6] font-bold text-xs rounded-2xl shadow-xs transition flex items-center gap-2"
          >
            <SettingsIcon className="w-4 h-4 text-[#2F7E6A]" /> Configurações Gerais
          </button>
          <button
            onClick={handleOpenNewUser}
            className="py-2.5 px-5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase block">Total de Usuários</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#1F2E2C]">{totalCount}</span>
            <Users className="w-5 h-5 text-[#2F7E6A]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase block">Super Admins</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-purple-900">{superAdminCount}</span>
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-teal-200 shadow-xs">
          <span className="text-[11px] font-bold text-teal-700 uppercase block">Administradores Clínicos</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-teal-900">{adminCount}</span>
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase block">1º Acesso Pendente</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-amber-900">{pendingFirstSetupCount}</span>
            <KeyRound className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, usuário ou e-mail..."
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2F7E6A]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
            <Filter className="w-3.5 h-3.5 text-[#2F7E6A]" /> Perfil:
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="all">Todos os Perfis</option>
            <option value="superadmin">Super Administrador</option>
            <option value="admin">Administrador</option>
            <option value="user">Cuidador / Usuário</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
            <option value="pending_first_setup">Troca de Senha Pendente</option>
          </select>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-3xl border-2 border-[#BFE8D6] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E9F7F2] text-[#1F2E2C] font-black border-b border-[#BFE8D6]">
                <th className="py-3.5 px-4">Usuário / Identificação</th>
                <th className="py-3.5 px-4">Perfil de Acesso</th>
                <th className="py-3.5 px-4">Status da Conta</th>
                <th className="py-3.5 px-4">Pergunta de Segurança</th>
                <th className="py-3.5 px-4">Último Login</th>
                <th className="py-3.5 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500 font-bold">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.uid === user.uid;
                  const isSuper = user.role === 'superadmin';

                  return (
                    <tr key={user.uid} className="hover:bg-gray-50/80 transition">
                      {/* User details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full border-2 border-[#63C6A7] object-cover shrink-0"
                          />
                          <div>
                            <div className="font-extrabold text-sm text-[#1F2E2C] flex items-center gap-1.5">
                              {user.displayName}
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
                              <span>@{user.username}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {user.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" /> Super ADMIN
                          </span>
                        ) : user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-100 text-teal-900 border border-teal-300">
                            <Shield className="w-3.5 h-3.5 text-teal-700" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
                            <User className="w-3.5 h-3.5 text-blue-700" /> Cuidador / Usuário
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {user.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Desativado
                            </span>
                          )}

                          {user.mustChangePassword && (
                            <div className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                              ⚠️ Troca de Senha Obrigatória
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Security Question */}
                      <td className="py-3.5 px-4">
                        {user.securityQuestion ? (
                          <span className="text-[11px] text-gray-700 flex items-center gap-1" title={user.securityQuestion}>
                            <HelpCircle className="w-3.5 h-3.5 text-[#2F7E6A]" /> Cadastrada
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Pendente de 1º acesso</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-[11px] text-gray-500">
                        {user.lastLoginAt ? (
                          new Date(user.lastLoginAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                        ) : (
                          'Ainda não acessou'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenResetPass(user)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200 transition"
                            title="Redefinir Senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-[#2F7E6A] hover:bg-emerald-50 rounded-lg border border-[#BFE8D6] transition"
                            title="Editar Perfil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg border transition ${
                                user.isActive !== false
                                  ? 'text-rose-700 hover:bg-rose-50 border-rose-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                              }`}
                              title={user.isActive !== false ? 'Desativar Conta' : 'Ativar Conta'}
                            >
                              {user.isActive !== false ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}

                          {!isSuper && !isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO USUÁRIO */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2F7E6A]" /> Cadastrar Novo Usuário
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 text-gray-500 hover:text-rose-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Nome de Usuário (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder=""
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="mariana@exemplo.com"
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Perfil de Acesso *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="user">Cuidador / Usuário (Operacional)</option>
                    <option value="admin">Administrador (Clínico)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Senha Inicial Provisória *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#BFE8D6] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-[#1F2E2C]">
                  <input
                    type="checkbox"
                    checked={formData.mustChangePassword}
                    onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                    className="w-4 h-4 text-[#2F7E6A] rounded"
                  />
                  <span>Exigir troca obrigatória de senha e definição de pergunta no 1º acesso (Recomendado)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                  Pergunta de Segurança Padrão
                </label>
                <select
                  value={formData.securityQuestion}
                  onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                >
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                  Resposta Secreta Padrão
                </label>
                <input
                  type="text"
                  value={formData.securityAnswer}
                  onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                  placeholder="Resposta de recuperação provisória"
                  className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#2F7E6A]" /> Editar Usuário: {selectedUser.displayName}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-gray-500 hover:text-rose-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Nome de Usuário (Login)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    disabled={selectedUser.role === 'superadmin'}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="user">Cuidador / Usuário</option>
                    <option value="admin">Administrador</option>
                    {selectedUser.role === 'superadmin' && (
                      <option value="superadmin">Super Administrador</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#BFE8D6] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-[#1F2E2C]">
                  <input
                    type="checkbox"
                    checked={formData.mustChangePassword}
                    onChange={(e) => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                    className="w-4 h-4 text-[#2F7E6A] rounded"
                  />
                  <span>Forçar troca de senha e configuração de pergunta no próximo acesso</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                  Pergunta de Segurança
                </label>
                <select
                  value={formData.securityQuestion}
                  onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                >
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                  Resposta de Segurança
                </label>
                <input
                  type="text"
                  value={formData.securityAnswer}
                  onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                  placeholder="Resposta cadastrada"
                  className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA POR ADMIN */}
      {isResetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-400 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-lg font-black text-[#1F2E2C] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" /> Redefinir Senha
              </h3>
              <button
                onClick={() => setIsResetPassModalOpen(false)}
                className="p-1 text-gray-500 hover:text-rose-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                Você está gerando uma nova senha para o usuário <strong>{selectedUser.displayName} (@{selectedUser.username})</strong>.
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                  Nova Senha Temporária
                </label>
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-amber-400 font-mono text-sm font-bold rounded-xl focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                <input
                  type="checkbox"
                  checked={forceFirstAccess}
                  onChange={(e) => setForceFirstAccess(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span>Exigir que o usuário altere esta senha no próximo login</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÕES GERAIS DO APLICATIVO (SUPER ADMIN) */}
      {isAppSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#2F7E6A]" /> Configurações Gerais do Aplicativo
              </h3>
              <button
                onClick={() => setIsAppSettingsOpen(false)}
                className="p-1 text-gray-500 hover:text-rose-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-[#1F2E2C]">
              <div className="p-3 bg-white rounded-2xl border border-[#BFE8D6] space-y-3">
                <h4 className="font-black text-sm text-[#2F7E6A]">Parâmetros de Alarme e Notificações</h4>
                <div className="flex items-center justify-between">
                  <span>Tempo de Escalonamento de Alarme Crítico (Minutos):</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.autoEscalateMinutes}
                    onChange={(e) => updateSettings({ autoEscalateMinutes: parseInt(e.target.value) || 15 })}
                    className="w-20 p-1.5 bg-gray-50 border border-gray-300 rounded-lg text-center font-bold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Alertas Sonoros Automáticos:</span>
                  <button
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`px-3 py-1 rounded-lg font-bold text-xs ${
                      settings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {settings.soundEnabled ? 'ATIVADO' : 'DESATIVADO'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span>Síntese de Voz (TTS para Idosos):</span>
                  <button
                    onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
                    className={`px-3 py-1 rounded-lg font-bold text-xs ${
                      settings.ttsEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {settings.ttsEnabled ? 'ATIVADO' : 'DESATIVADO'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#BFE8D6] space-y-2">
                <h4 className="font-black text-sm text-[#2F7E6A]">Segurança & Políticas de Senha</h4>
                <p className="text-gray-600 text-[11px]">
                  • Exigência de pergunta secreta de segurança para recuperação autônoma de senha.<br />
                  • Troca obrigatória de senha no primeiro login de novos usuários.<br />
                  • Registro auditável de todas as ações de dosagem e alterações no banco de dados.
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsAppSettingsOpen(false)}
                  className="py-2.5 px-5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
