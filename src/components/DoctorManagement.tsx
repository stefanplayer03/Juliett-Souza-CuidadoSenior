import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Doctor } from '../types';
import { Stethoscope, Plus, Phone, Building2, FileText, Trash2, Edit2 } from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crm) return;

    if (editingId) {
      updateDoctor(editingId, { name, specialty, crm, phone, clinic, notes }, userName);
    } else {
      addDoctor({ name, specialty, crm, phone, clinic, notes }, userName);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover este médico da lista?')) {
      deleteDoctor(id, userName);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-[#2F7E6A]" /> Corpo Médico Atendente
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Contatos de médicos especialistas, número de CRM e clínicas de atendimento
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Cadastrar Médico
          </button>
        )}
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm flex flex-col justify-between hover:border-[#63C6A7] transition space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-black text-[#1F2E2C]">{d.name}</h3>
                  <span className="inline-block mt-1 px-3 py-0.5 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-bold rounded-full">
                    {d.specialty}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1.5 text-gray-500 hover:text-[#2F7E6A] rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-[#1F2E2C] space-y-1.5 pt-2 border-t border-gray-100">
                <p className="font-bold text-[#2F7E6A]">Registro Profissional: {d.crm}</p>
                <p className="flex items-center gap-2 font-semibold">
                  <Phone className="w-4 h-4 text-[#2F7E6A]" /> Telefone: <strong>{d.phone}</strong>
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <Building2 className="w-4 h-4 text-[#2F7E6A]" /> Clínica: <strong>{d.clinic}</strong>
                </p>
                {d.notes && (
                  <p className="text-xs text-gray-600 bg-[#E9F7F2] p-2.5 rounded-xl border border-[#63C6A7] italic mt-2">
                    "{d.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-[#0] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-[#63C6A7]">
            <h3 className="text-xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6]">
              {editingId ? 'Editar Médico' : 'Cadastrar Médico'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo do Médico *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dra. Ana Costa"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Especialidade</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Cardiologia & Geriatria"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CRM *</label>
                <input
                  type="text"
                  required
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  placeholder="CRM/SP 12345"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Telefone da Clínica</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 3333-4444"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome da Clínica / Hospital</label>
                <input
                  type="text"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  placeholder="Clínica Vida Senior"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações Médicas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações de recomendações..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs"
                  rows={2}
                />
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
                  Salvar Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
