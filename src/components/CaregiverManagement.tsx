import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Caregiver, CaregiverRelation } from '../types';
import {
  Users,
  UserCheck,
  Plus,
  Phone,
  Mail,
  Bell,
  Trash2,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Copy,
  Lock,
  Camera,
} from 'lucide-react';
import { ProfilePhotoModal } from './ProfilePhotoModal';

export const CaregiverManagement: React.FC = () => {
  const {
    patient,
    caregivers,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    setCaregiverOnDuty,
    activeCaregiverOnDuty,
  } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCaregiver, setDeletingCaregiver] = useState<Caregiver | null>(null);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<CaregiverRelation>('Cuidador');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [shiftHours, setShiftHours] = useState('');
  const [notes, setNotes] = useState('');
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [username, setUsername] = useState('');
  const [accessPassword, setAccessPassword] = useState('Familia2026');
  const [canAdministerMeds, setCanAdministerMeds] = useState(true);
  const [canEditData, setCanEditData] = useState(false);

  const [photo, setPhoto] = useState('');
  const [editingPhotoCaregiver, setEditingPhotoCaregiver] = useState<Caregiver | null>(null);
  const [isCaregiverPhotoModalOpen, setIsCaregiverPhotoModalOpen] = useState(false);
  const [isFormPhotoPickerOpen, setIsFormPhotoPickerOpen] = useState(false);

  const userName = currentUser?.displayName || 'Administrador';

  const resetForm = () => {
    setName('');
    setPhoto('');
    setRelationship('Cuidador');
    setPhone('');
    setEmail('');
    setCpf('');
    setShiftHours('');
    setNotes('');
    setReceiveNotifications(true);
    setUsername('');
    setAccessPassword('Familia2026');
    setCanAdministerMeds(true);
    setCanEditData(false);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Caregiver) => {
    setEditingId(c.id);
    setName(c.name);
    setPhoto(c.photo || '');
    setRelationship(c.relationship);
    setPhone(c.phone);
    setEmail(c.email);
    setCpf(c.cpf || '');
    setShiftHours(c.shiftHours || '');
    setNotes(c.notes || '');
    setReceiveNotifications(c.receiveNotifications);
    setUsername(c.username || '');
    setAccessPassword(c.accessPassword || 'Familia2026');
    setCanAdministerMeds(c.canAdministerMeds ?? true);
    setCanEditData(c.canEditData ?? false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o Nome Completo do membro.');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor, informe o Telefone/WhatsApp do membro.');
      return;
    }

    const assignedUsername = username.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.') || `resp.${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedPassword = accessPassword.trim() || 'Familia2026';

    if (editingId) {
      updateCaregiver(
        editingId,
        {
          name,
          photo: photo || undefined,
          relationship,
          phone,
          email,
          cpf,
          shiftHours,
          notes,
          receiveNotifications,
          username: assignedUsername,
          accessPassword: assignedPassword,
          canAdministerMeds,
          canEditData,
        },
        userName
      );
      setSuccessMsg(`Perfil de ${name} (${relationship}) atualizado com sucesso! Subcadastro: @${assignedUsername}`);
    } else {
      addCaregiver(
        {
          name,
          photo: photo || undefined,
          relationship,
          phone,
          email,
          cpf,
          shiftHours,
          notes,
          isCurrentlyOnDuty: caregivers.length === 0,
          receiveNotifications,
          username: assignedUsername,
          accessPassword: assignedPassword,
          canAdministerMeds,
          canEditData,
        },
        userName
      );
      setSuccessMsg(`Novo membro ${name} registrado com sucesso como ${relationship}! Subcadastro criado com login @${assignedUsername}`);
    }

    setIsModalOpen(false);
    setShowInlineForm(false);
    resetForm();

    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleOpenDeleteModal = (c: Caregiver) => {
    setDeletingCaregiver(c);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingCaregiver) return;
    const targetName = deletingCaregiver.name;
    const targetRel = deletingCaregiver.relationship;

    deleteCaregiver(deletingCaregiver.id, userName);

    setSuccessMsg(
      `O cadastro de ${targetName} (${targetRel}) foi excluído com sucesso! Todos os relatórios e logs de medicamentos aplicados foram mantidos intactos no histórico.`
    );
    setIsDeleteModalOpen(false);
    setDeletingCaregiver(null);

    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Alert */}
      {successMsg && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-white/80 hover:text-white font-bold text-xs"
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* Active Duty Caregiver Banner */}
      <div className="bg-[#2F7E6A] text-white p-6 rounded-3xl shadow-md border-3 border-[#63C6A7] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-[#BFE8D6] shrink-0 border border-white/20">
            <UserCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#BFE8D6] uppercase tracking-wider block">
              Responsável em Plantão Atual
            </span>
            <h3 className="text-2xl font-black tracking-tight">
              {activeCaregiverOnDuty
                ? `${activeCaregiverOnDuty.name} (${activeCaregiverOnDuty.relationship})`
                : 'Nenhum responsável em plantão'}
            </h3>
            {activeCaregiverOnDuty && (
              <p className="text-xs text-white/80 font-semibold mt-0.5 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#BFE8D6]" /> {activeCaregiverOnDuty.phone}
                <span className="opacity-50">•</span>
                <Mail className="w-3.5 h-3.5 text-[#BFE8D6]" /> {activeCaregiverOnDuty.email || 'Não informado'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (showInlineForm && !editingId) {
                setShowInlineForm(false);
              } else {
                resetForm();
                setShowInlineForm(true);
              }
            }}
            className="px-5 py-3 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center gap-2 transition shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            {showInlineForm && !editingId ? 'Ocultar Formulario' : 'Cadastrar Novo Membro (Perfil Completo)'}
          </button>
        </div>
      </div>

      {/* INLINE REGISTRATION FORM CARD (CADASTRO DIRETO DE NOVO MEMBRO) */}
      {showInlineForm && (
        <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6]">
            <div>
              <span className="px-2.5 py-1 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md uppercase">
                {editingId ? 'Edição de Membro' : 'Inclusão de Novo Membro'}
              </span>
              <h3 className="text-xl font-black text-[#1F2E2C] mt-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2F7E6A]" />
                {editingId ? `Editar Perfil: ${name}` : 'Cadastrar Perfil Completo (Cuidador, Filha/o, Responsável, Curador, Enfermeiro)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowInlineForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-800 font-bold text-xs px-3 py-1 bg-white rounded-xl border border-gray-200"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Role Selection Chips */}
            <div>
              <label className="block text-xs font-extrabold text-[#1F2E2C] mb-2">
                1. Selecione o Papel / Perfil de Cuidado do Membro:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🩺 Cuidador(a)', val: 'Cuidador' },
                  { label: '👧 Filha', val: 'Filha' },
                  { label: '👦 Filho', val: 'Filho' },
                  { label: '🛡️ Responsável', val: 'Responsável' },
                  { label: '⚖️ Curador(a)', val: 'Curador' },
                  { label: '👨‍⚕️ Enfermeiro(a)', val: 'Enfermeiro(a)' },
                  { label: '💍 Esposa', val: 'Esposa' },
                  { label: '💍 Marido', val: 'Marido' },
                  { label: '👥 Outro', val: 'Outro' },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setRelationship(chip.val as CaregiverRelation)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition border-2 ${
                      relationship === chip.val
                        ? 'bg-[#2F7E6A] text-white border-[#2F7E6A] shadow-md scale-105'
                        : 'bg-white text-[#1F2E2C] border-[#BFE8D6] hover:border-[#63C6A7]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Mariana Souza / João Oliveira"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CPF do Membro</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">E-mail para Notificações</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="membro@email.com"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Turno / Horário de Plantão</label>
                <input
                  type="text"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  placeholder="Ex: 12x36 (07:00 às 19:00)"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações / Instruções</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recomendações técnicas ou contatos extras..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* Sub-account Login Credentials Box (Inline) */}
            <div className="p-3.5 bg-[#E9F7F2] rounded-2xl border-2 border-[#63C6A7] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2F7E6A]">
                  <KeyRound className="w-4 h-4 text-[#2F7E6A]" />
                  <span>Subcadastro de Acesso do Responsável</span>
                </div>
                <span className="text-[11px] font-bold text-[#1F2E2C]">
                  Vinculado a: <strong>{patient.fullName}</strong>
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Este membro terá credenciais exclusivas para acessar o perfil e medicações do paciente <strong>{patient.fullName}</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                    Usuário / Login de Acesso
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: maria.santos"
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold text-[#1F2E2C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="text"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="Ex: Familia2026"
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-mono font-bold text-[#1F2E2C]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                  <input
                    type="checkbox"
                    checked={canAdministerMeds}
                    onChange={(e) => setCanAdministerMeds(e.target.checked)}
                    className="w-4 h-4 text-[#2F7E6A] rounded"
                  />
                  Pode Confirmar Remédios Ministrados
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                  <input
                    type="checkbox"
                    checked={canEditData}
                    onChange={(e) => setCanEditData(e.target.checked)}
                    className="w-4 h-4 text-[#2F7E6A] rounded"
                  />
                  Pode Editar Agenda e Informações Médicas
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="receiveNotifInline"
                checked={receiveNotifications}
                onChange={(e) => setReceiveNotifications(e.target.checked)}
                className="w-4 h-4 text-[#2F7E6A] rounded"
              />
              <label htmlFor="receiveNotifInline" className="text-xs font-bold text-[#1F2E2C]">
                Receber alertas de medicação em atraso e relatórios por SMS/WhatsApp/App
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
              <button
                type="button"
                onClick={() => {
                  setShowInlineForm(false);
                  resetForm();
                }}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                {editingId ? 'Salvar Alterações' : 'Confirmar Inclusão do Membro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Responsibles Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caregivers.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-3xl p-6 border-2 shadow-sm space-y-4 flex flex-col justify-between transition ${
              c.isCurrentlyOnDuty
                ? 'border-[#2F7E6A] ring-2 ring-[#63C6A7] bg-[#E9F7F2]/40'
                : 'border-[#BFE8D6] hover:border-[#63C6A7]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhotoCaregiver(c);
                      setIsCaregiverPhotoModalOpen(true);
                    }}
                    className="relative group cursor-pointer shrink-0"
                    title="Clique para editar ou trocar a foto de perfil deste membro"
                  >
                    <img
                      src={c.photo || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120'}
                      alt={c.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#63C6A7] shadow-xs group-hover:opacity-80 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-[#1F2E2C] leading-tight">{c.name}</h4>
                      {c.isCurrentlyOnDuty && (
                        <span className="px-2 py-0.5 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Em Plantão
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-bold rounded-full">
                      {c.relationship}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhotoCaregiver(c);
                      setIsCaregiverPhotoModalOpen(true);
                    }}
                    className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl transition cursor-pointer"
                    title="Trocar Foto de Perfil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl transition"
                    title="Editar Perfil"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(c)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Excluir Membro (Abre confirmação)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#1F2E2C] space-y-1.5 pt-2 border-t border-gray-100">
                <p className="flex items-center gap-2 font-semibold">
                  <Phone className="w-4 h-4 text-[#2F7E6A]" /> {c.phone}
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4 text-[#2F7E6A]" /> {c.email || 'Não informado'}
                </p>
                {c.cpf && (
                  <p className="flex items-center gap-2 font-semibold text-gray-700">
                    <ShieldCheck className="w-4 h-4 text-[#2F7E6A]" /> CPF: {c.cpf}
                  </p>
                )}
                {c.shiftHours && (
                  <p className="flex items-center gap-2 font-semibold text-gray-700">
                    <UserCheck className="w-4 h-4 text-[#2F7E6A]" /> Turno: {c.shiftHours}
                  </p>
                )}
                {c.notes && (
                  <p className="text-[11px] font-medium text-gray-600 bg-[#E9F7F2] p-2 rounded-xl border border-[#BFE8D6]">
                    📝 {c.notes}
                  </p>
                )}
                {/* Subcadastro Credentials Box */}
                <div className="bg-[#E9F7F2] p-2.5 rounded-2xl border border-[#BFE8D6] space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#2F7E6A] flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#2F7E6A]" /> Subcadastro de Acesso
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      Vinculado a {patient.fullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-xl border border-[#BFE8D6]">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Usuário:</span>
                      <strong className="text-[#1F2E2C] font-mono">@{c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Senha:</span>
                      <strong className="text-[#1F2E2C] font-mono">{c.accessPassword || 'Familia2026'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const userLogin = c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
                        const pass = c.accessPassword || 'Familia2026';
                        navigator.clipboard.writeText(`Acesso ao CuidadoSenior\nPaciente: ${patient.fullName}\nUsuário: ${userLogin}\nSenha: ${pass}`);
                        setSuccessMsg(`Credenciais de acesso de ${c.name} copiadas com sucesso!`);
                        setTimeout(() => setSuccessMsg(null), 3500);
                      }}
                      className="px-2.5 py-1 bg-[#2F7E6A] hover:bg-[#256555] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs"
                      title="Copiar dados de login para enviar ao responsável"
                    >
                      <Copy className="w-3 h-3" /> Copiar Acesso
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 px-0.5">
                    <span>Ministra Remédios: <strong className="text-[#1F2E2C]">{c.canAdministerMeds !== false ? 'SIM' : 'NÃO'}</strong></span>
                    <span>•</span>
                    <span>Edita Ficha: <strong className="text-[#1F2E2C]">{c.canEditData ? 'SIM' : 'NÃO'}</strong></span>
                  </div>
                </div>

                <p className="flex items-center gap-2 font-semibold text-gray-600">
                  <Bell className="w-4 h-4 text-[#2F7E6A]" /> Alertas SMS/Push:{' '}
                  <strong>{c.receiveNotifications ? 'Ativados' : 'Desativados'}</strong>
                </p>
              </div>
            </div>

            {/* Set On Duty Button */}
            {!c.isCurrentlyOnDuty && (
              <button
                onClick={() => setCaregiverOnDuty(c.id, userName)}
                className="w-full py-2.5 bg-[#E9F7F2] hover:bg-[#BFE8D6] text-[#2F7E6A] font-extrabold text-xs rounded-xl transition border border-[#63C6A7]"
              >
                Definir como Responsável em Plantão
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Admin Add / Edit Modal Dialogue */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6]">
              {editingId ? 'Editar Perfil do Membro' : 'Cadastrar Novo Membro (Perfil Completo)'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Selector in Form */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#63C6A7] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={photo || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120'}
                    alt="Foto do perfil"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2F7E6A] shadow-xs"
                  />
                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C]">Foto de Perfil do Membro</label>
                    <p className="text-[11px] text-gray-500 font-semibold">Tire foto, envie arquivo do celular ou escolha avatar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormPhotoPickerOpen(true)}
                  className="px-3.5 py-2 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4 text-[#63C6A7]" /> Escolher Foto
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Mariana Souza / João Oliveira"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Papel / Perfil no Cuidado *</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as any)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-bold text-[#2F7E6A]"
                  >
                    <option value="Cuidador">Cuidador(a)</option>
                    <option value="Filha">Filha</option>
                    <option value="Filho">Filho</option>
                    <option value="Responsável">Responsável</option>
                    <option value="Curador">Curador(a)</option>
                    <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                    <option value="Esposa">Esposa</option>
                    <option value="Marido">Marido</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CPF do Membro</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Turno / Horário de Trabalho</label>
                  <input
                    type="text"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    placeholder="Ex: 12x36 (07:00 às 19:00)"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">E-mail para Notificações</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="membro@email.com"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações / Diretrizes do Cuidado</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais, credenciais ou recomendações de plantão..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-medium"
                />
              </div>

              {/* Sub-account Login Credentials Box (Modal) */}
              <div className="p-3.5 bg-white rounded-2xl border-2 border-[#63C6A7] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#2F7E6A]">
                    <KeyRound className="w-4 h-4 text-[#2F7E6A]" />
                    <span>Subcadastro de Acesso do Responsável</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1F2E2C]">
                    Vinculado a: <strong>{patient.fullName}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium">
                  Este membro terá credenciais exclusivas para acessar o perfil e medicações do paciente <strong>{patient.fullName}</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                      Usuário / Login de Acesso
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: maria.santos"
                      className="w-full p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-bold text-[#1F2E2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                      Senha de Acesso
                    </label>
                    <input
                      type="text"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      placeholder="Ex: Familia2026"
                      className="w-full p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-mono font-bold text-[#1F2E2C]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                    <input
                      type="checkbox"
                      checked={canAdministerMeds}
                      onChange={(e) => setCanAdministerMeds(e.target.checked)}
                      className="w-4 h-4 text-[#2F7E6A] rounded"
                    />
                    Pode Confirmar Remédios Ministrados
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                    <input
                      type="checkbox"
                      checked={canEditData}
                      onChange={(e) => setCanEditData(e.target.checked)}
                      className="w-4 h-4 text-[#2F7E6A] rounded"
                    />
                    Pode Editar Agenda e Informações Médicas
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="receiveNotif"
                  checked={receiveNotifications}
                  onChange={(e) => setReceiveNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#2F7E6A] rounded"
                />
                <label htmlFor="receiveNotif" className="text-xs font-bold text-[#1F2E2C]">
                  Receber alertas de medicação em atraso (SMS / App)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2F7E6A] text-white font-extrabold rounded-xl text-xs shadow"
                >
                  Salvar Perfil Completo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialogue: Confirm Deletion of Responsible Member */}
      {isDeleteModalOpen && deletingCaregiver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-rose-500 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Trash2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Confirmar Exclusão</h3>
                <p className="text-xs font-bold text-rose-600">Caixa de Diálogo de Confirmação</p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
              <p className="text-sm font-extrabold text-gray-900">
                Tem certeza de que deseja excluir o cadastro de:
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                <p className="font-black text-base text-[#1F2E2C]">{deletingCaregiver.name}</p>
                <p className="text-xs font-bold text-[#2F7E6A]">Papel: {deletingCaregiver.relationship}</p>
                {deletingCaregiver.phone && (
                  <p className="text-xs font-semibold text-gray-600">Contato: {deletingCaregiver.phone}</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Garantia de Integridade e Histórico Médico</span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                A exclusão deste cadastro <strong>não apagará</strong> os logs de medicamentos já aplicados por este responsável. O nome <strong>{deletingCaregiver.name}</strong> permanecerá registrado no histórico permanente e relatórios de auditoria.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingCaregiver(null);
                }}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Photo modal for clicking directly on caregiver card avatar */}
      {editingPhotoCaregiver && (
        <ProfilePhotoModal
          isOpen={isCaregiverPhotoModalOpen}
          onClose={() => {
            setIsCaregiverPhotoModalOpen(false);
            setEditingPhotoCaregiver(null);
          }}
          currentPhoto={editingPhotoCaregiver.photo}
          userName={editingPhotoCaregiver.name}
          userRole={editingPhotoCaregiver.relationship}
          userLogin={editingPhotoCaregiver.username}
          title={`Foto de ${editingPhotoCaregiver.name}`}
          subtitle="Troque ou personalize a foto de perfil deste membro do cuidado."
          onSavePhoto={(newPhotoUrl) => {
            updateCaregiver(editingPhotoCaregiver.id, { photo: newPhotoUrl }, userName);
            setSuccessMsg(`Foto de ${editingPhotoCaregiver.name} atualizada com sucesso!`);
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      )}

      {/* Photo modal for form selector */}
      <ProfilePhotoModal
        isOpen={isFormPhotoPickerOpen}
        onClose={() => setIsFormPhotoPickerOpen(false)}
        currentPhoto={photo}
        userName={name || 'Membro do Cuidado'}
        userRole={relationship}
        userLogin={username}
        title="Escolher Foto do Membro"
        subtitle="Carregue uma foto do dispositivo, cole link ou selecione um avatar."
        onSavePhoto={(newPhotoUrl) => {
          setPhoto(newPhotoUrl);
        }}
      />
    </div>
  );
};
