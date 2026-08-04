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
} from 'lucide-react';

export const CaregiverManagement: React.FC = () => {
  const {
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<CaregiverRelation>('Cuidador');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [receiveNotifications, setReceiveNotifications] = useState(true);

  const userName = currentUser?.displayName || 'Administrador';

  const resetForm = () => {
    setName('');
    setRelationship('Cuidador');
    setPhone('');
    setEmail('');
    setReceiveNotifications(true);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Caregiver) => {
    setEditingId(c.id);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setEmail(c.email);
    setReceiveNotifications(c.receiveNotifications);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingId) {
      updateCaregiver(
        editingId,
        { name, relationship, phone, email, receiveNotifications },
        userName
      );
    } else {
      addCaregiver(
        {
          name,
          relationship,
          phone,
          email,
          isCurrentlyOnDuty: caregivers.length === 0,
          receiveNotifications,
        },
        userName
      );
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover este responsável do cadastro?')) {
      deleteCaregiver(id, userName);
    }
  };

  return (
    <div className="space-y-6">
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
                <Mail className="w-3.5 h-3.5 text-[#BFE8D6]" /> {activeCaregiverOnDuty.email}
              </p>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Cadastrar Responsável
          </button>
        )}
      </div>

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
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-[#1F2E2C]">{c.name}</h4>
                    {c.isCurrentlyOnDuty && (
                      <span className="px-2 py-0.5 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Em Plantão
                      </span>
                    )}
                  </div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-bold rounded-full">
                    {c.relationship}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-gray-500 hover:text-[#2F7E6A] rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-xs text-[#1F2E2C] space-y-1.5 pt-2 border-t border-gray-100">
                <p className="flex items-center gap-2 font-semibold">
                  <Phone className="w-4 h-4 text-[#2F7E6A]" /> {c.phone}
                </p>
                <p className="flex items-center gap-2 font-semibold">
                  <Mail className="w-4 h-4 text-[#2F7E6A]" /> {c.email}
                </p>
                <p className="flex items-center gap-2 font-semibold text-gray-600">
                  <Bell className="w-4 h-4 text-[#2F7E6A]" /> Alertas SMS/Push:{' '}
                  <strong>{c.receiveNotifications ? 'Ativados' : 'Desativados'}</strong>
                </p>
              </div>
            </div>

            {/* Set On Duty Button */}
            {!c.isCurrentlyOnDuty && isAdmin && (
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

      {/* Admin Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-[#0] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-[#63C6A7]">
            <h3 className="text-xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6]">
              {editingId ? 'Editar Responsável' : 'Cadastrar Novo Responsável'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Oliveira"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Grau de Parentesco / Papel</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                >
                  <option value="Filho">Filho</option>
                  <option value="Filha">Filha</option>
                  <option value="Esposa">Esposa</option>
                  <option value="Marido">Marido</option>
                  <option value="Cuidador">Cuidador</option>
                  <option value="Curador">Curador</option>
                  <option value="Enfermeiro">Enfermeiro</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

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
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">E-mail para Notificações</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cuidador@email.com"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="receiveNotif"
                  checked={receiveNotifications}
                  onChange={(e) => setReceiveNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#2F7E6A] rounded"
                />
                <label htmlFor="receiveNotif" className="text-xs font-bold text-[#1F2E2C]">
                  Receber alertas de medicação em atraso
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
