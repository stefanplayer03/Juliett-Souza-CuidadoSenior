import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Doctor } from '../types';
import { Stethoscope, Plus, Phone, Building2, Trash2, Edit2, CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useApp();
  const { currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [crm, setCrm] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [notes, setNotes] = useState('');

  const userName = currentUser?.displayName || 'Administrador';

  const resetForm = () => {
    setName('');
    setSpecialty('');
    setCrm('');
    setPhone('');
    setClinic('');
    setNotes('');
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Doctor) => {
    setEditingId(d.id);
    setName(d.name);
    setSpecialty(d.specialty);
    setCrm(d.crm);
    setPhone(d.phone);
    setClinic(d.clinic);
    setNotes(d.notes);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (d: Doctor) => {
    setDeletingDoctor(d);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingDoctor) return;
    const doctorName = deletingDoctor.name;
    const doctorSpec = deletingDoctor.specialty || 'Especialista';

    deleteDoctor(deletingDoctor.id, userName);

    setSuccessMsg(
      `O cadastro do(a) médico(a) ${doctorName} (${doctorSpec}) foi excluído com sucesso! As receitas e históricos médicos associados permanecem salvos.`
    );
    setIsDeleteModalOpen(false);
    setDeletingDoctor(null);

    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o Nome Completo do Médico.');
      return;
    }
    if (!crm.trim()) {
      alert('Por favor, informe o CRM do Médico.');
      return;
    }

    if (editingId) {
      updateDoctor(editingId, { name, specialty, crm, phone, clinic, notes }, userName);
      setSuccessMsg(`Cadastro do médico ${name} atualizado com sucesso!`);
    } else {
      addDoctor({ name, specialty, crm, phone, clinic, notes }, userName);
      setSuccessMsg(`Novo médico ${name} (${specialty || 'Especialista'}) cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
    resetForm();

    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const commonSpecialties = [
    'Geriatria',
    'Neurologia',
    'Cardiologia',
    'Ortopedia',
    'Psiquiatria',
    'Endocrinologia',
    'Fisioterapia',
    'Nutrição',
    'Clínica Geral',
  ];

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

      {/* Top Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-[#2F7E6A]" /> Corpo Médico Atendente
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Cadastro de médicos especialistas, doutores, contato e clínicas que acompanham o tratamento
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" /> Cadastrar Novo Médico / Especialista
        </button>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-3xl border-2 border-dashed border-[#63C6A7] text-center space-y-3">
            <Users className="w-12 h-12 text-[#2F7E6A] mx-auto opacity-50" />
            <p className="text-base font-bold text-[#1F2E2C]">Nenhum médico cadastrado no momento.</p>
            <p className="text-xs text-gray-500">Clique no botão acima para incluir um novo médico especialista que acompanha o tratamento.</p>
          </div>
        ) : (
          doctors.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm flex flex-col justify-between hover:border-[#63C6A7] transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-[#1F2E2C]">{d.name}</h3>
                    <span className="inline-block mt-1 px-3 py-1 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-black rounded-full">
                      {d.specialty || 'Clínica Geral'}
                    </span>
                  </div>

                  {/* Top-Right Action Buttons for Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl transition"
                      title="Editar Perfil do Médico"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(d)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Excluir Cadastro do Médico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[#1F2E2C] space-y-2 pt-3 border-t border-gray-100">
                  <p className="font-bold text-[#2F7E6A]">CRM / Registro: {d.crm || 'Não informado'}</p>
                  <p className="flex items-center gap-2 font-semibold">
                    <Phone className="w-4 h-4 text-[#2F7E6A]" /> Telefone/WhatsApp: <strong>{d.phone || 'Não informado'}</strong>
                  </p>
                  <p className="flex items-center gap-2 font-semibold">
                    <Building2 className="w-4 h-4 text-[#2F7E6A]" /> Clínica / Hospital: <strong>{d.clinic || 'Não informado'}</strong>
                  </p>
                  {d.notes && (
                    <div className="text-xs text-gray-700 bg-[#E9F7F2] p-3 rounded-2xl border border-[#63C6A7] mt-2">
                      <span className="font-bold text-[#2F7E6A] block mb-0.5">Observações Médicas:</span>
                      <p className="italic">{d.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Doctor Modal Dialogue */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6] flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-[#2F7E6A]" />
              {editingId ? 'Editar Cadastro do Médico' : 'Cadastrar Novo Médico Especialista'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Specialty Quick Chips */}
              <div>
                <label className="block text-xs font-extrabold text-[#1F2E2C] mb-2">
                  Seleção Rápida de Especialidade:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {commonSpecialties.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSpecialty(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        specialty === spec
                          ? 'bg-[#2F7E6A] text-white border-[#2F7E6A] shadow-sm'
                          : 'bg-white text-[#1F2E2C] border-[#BFE8D6] hover:border-[#63C6A7]'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo do Médico *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dr. Carlos Eduardo / Dra. Ana Costa"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Especialidade Médica</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Geriatria & Cardiologia"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CRM / Registro Profissional *</label>
                <input
                  type="text"
                  required
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  placeholder="Ex: CRM/SP 123456"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Telefone / WhatsApp de Contato</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321 ou (11) 3333-4444"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Clínica, Consultório ou Hospital</label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="Ex: Hospital das Clínicas / Consultório Vida Sênior"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações / Recomendações do Médico</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações de orientações, horários de consulta ou contatos de emergência..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-medium"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold rounded-xl text-xs shadow-md transition"
                >
                  {editingId ? 'Salvar Alterações' : 'Confirmar Inclusão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialogue: Confirm Deletion of Doctor */}
      {isDeleteModalOpen && deletingDoctor && (
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
                Tem certeza de que deseja excluir o cadastro do(a) médico(a):
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                <p className="font-black text-base text-[#1F2E2C]">{deletingDoctor.name}</p>
                <p className="text-xs font-bold text-[#2F7E6A]">Especialidade: {deletingDoctor.specialty || 'Não informada'}</p>
                <p className="text-xs font-semibold text-gray-600">CRM: {deletingDoctor.crm}</p>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Preservação de Prontuários e Histórico</span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                A remoção deste cadastro não apagará prescrições, receitas ou históricos de atendimentos previamente registrados com este médico.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingDoctor(null);
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
    </div>
  );
};

