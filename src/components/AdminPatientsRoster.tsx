import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../types';
import {
  Shield,
  User,
  Users,
  Pill,
  Search,
  CheckCircle2,
  Phone,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Activity,
  Check,
  FileText
} from 'lucide-react';
import { audioService } from '../services/audio';

interface AdminPatientsRosterProps {
  onAddNewPatient?: () => void;
}

export const AdminPatientsRoster: React.FC<AdminPatientsRosterProps> = ({ onAddNewPatient }) => {
  const {
    patients,
    activePatientId,
    selectPatientById,
    medications,
    caregivers,
    setCurrentView,
    addPatient,
  } = useApp();

  const { currentUser, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active'>('all');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientCpf, setNewPatientCpf] = useState('');

  const userName = currentUser?.displayName || 'Administrador';

  // Filter patients by search term
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchName = p.fullName.toLowerCase().includes(term);
    const matchId = p.id.toLowerCase().includes(term);
    const matchCpf = p.cpf.toLowerCase().includes(term);
    return matchName || matchId || matchCpf;
  });

  const handleSelectPatient = (id: string, name: string) => {
    audioService.playClickSound();
    selectPatientById(id);
    audioService.speakText(`Paciente ${name} selecionado.`);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const customId = `PAC-${Math.floor(1000 + Math.random() * 9000)}`;
    addPatient(
      {
        id: customId,
        fullName: newPatientName.trim(),
        cpf: newPatientCpf.trim() || 'Não informado',
        birthDate: '1950-01-01',
        phone: '',
        emergencyPhone: '',
        address: '',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        bloodType: 'O+',
        weight: 65,
        height: 1.6,
        allergies: [],
        diseases: [],
        notes: 'Cadastrado pelo Administrador via Painel de Controle Geral.',
        isFirstSetupCompleted: false,
      },
      userName
    );

    setNewPatientName('');
    setNewPatientCpf('');
    setIsQuickAddOpen(false);
    audioService.playClickSound();
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-3 border-[#2F7E6A] shadow-md space-y-5">
      {/* Top Banner: Admin Badge & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#BFE8D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#2F7E6A] text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-[#63C6A7]" /> PAINEL DO ADMINISTRADOR (ADM)
            </span>
            <span className="px-2.5 py-0.5 bg-[#E9F7F2] text-[#2F7E6A] font-black text-xs rounded-full border border-[#63C6A7]">
              {patients.length} Pacientes Cadastrados
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#1F2E2C] mt-2 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2F7E6A]" /> Lista Geral de Pacientes Cadastrados
          </h2>
          <p className="text-xs text-gray-600 font-semibold mt-0.5">
            Gerenciamento centralizado de todos os pacientes da instituição ou família. Selecione qualquer paciente para monitorar e auditar seus dados.
          </p>
        </div>

        {/* Action Button: Quick Add Patient */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="px-4 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Novo Paciente (ID)
          </button>
        </div>
      </div>

      {/* Quick Add Form Drawer */}
      {isQuickAddOpen && (
        <form onSubmit={handleQuickAdd} className="p-4 bg-[#E9F7F2] rounded-2xl border-2 border-[#63C6A7] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-[#1F2E2C] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#2F7E6A]" /> Cadastro Rápido de Novo Paciente
            </h4>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="text-gray-400 hover:text-gray-600 font-bold text-xs"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                Nome Completo do Paciente *
              </label>
              <input
                type="text"
                required
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Ex: Dona Alzira Maria de Oliveira"
                className="w-full p-2 bg-white border border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                CPF (Opcional)
              </label>
              <input
                type="text"
                value={newPatientCpf}
                onChange={(e) => setNewPatientCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full p-2 bg-white border border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#2F7E6A] text-white font-black text-xs rounded-xl shadow hover:bg-[#256555] transition"
            >
              Confirmar e Cadastrar Paciente
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nome, ID ou CPF..."
            className="w-full pl-9 pr-4 py-2 bg-[#E9F7F2]/40 border-2 border-[#BFE8D6] rounded-xl text-xs font-semibold text-[#1F2E2C] focus:outline-none focus:border-[#63C6A7]"
          />
        </div>

        <span className="text-xs font-bold text-gray-500 self-end sm:self-center">
          Exibindo <strong>{filteredPatients.length}</strong> de {patients.length} pacientes
        </span>
      </div>

      {/* Grid of Registered Patients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((p) => {
          const isActive = p.id === activePatientId;
          const patientMeds = medications.filter((m) => m.patientId === p.id);
          const patientCaregivers = caregivers.filter((c) => c.patientId === p.id);

          return (
            <div
              key={p.id}
              onClick={() => handleSelectPatient(p.id, p.fullName)}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                isActive
                  ? 'border-[#2F7E6A] bg-[#E9F7F2] ring-3 ring-[#63C6A7]/50 shadow-md'
                  : 'border-[#BFE8D6] bg-white hover:border-[#63C6A7] hover:shadow-sm'
              }`}
            >
              {/* Active Badge Marker */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-[#2F7E6A] text-white px-3 py-0.5 rounded-bl-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" /> Paciente Ativo
                </div>
              )}

              {/* Patient Basic Info */}
              <div className="flex items-start gap-3">
                <img
                  src={p.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                  alt={p.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#63C6A7] shrink-0 shadow-sm"
                />

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md tracking-wider">
                      {p.id}
                    </span>
                    <span className="px-2 py-0.5 bg-white text-[#2F7E6A] border border-[#63C6A7] font-extrabold text-[10px] rounded-md">
                      {p.bloodType}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#1F2E2C] truncate mt-1">
                    {p.fullName}
                  </h3>

                  <p className="text-[11px] text-gray-500 font-semibold truncate">
                    CPF: {p.cpf || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Quick Metrics & Details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#BFE8D6]/70 text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                  <Pill className="w-3.5 h-3.5 text-[#2F7E6A]" />
                  <span>{patientMeds.length > 0 ? `${patientMeds.length} remédios` : 'Nenhum remédio'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                  <Users className="w-3.5 h-3.5 text-[#2F7E6A]" />
                  <span>{patientCaregivers.length > 0 ? `${patientCaregivers.length} responsável` : 'Sem responsáveis'}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                {isActive ? (
                  <div className="w-full py-2 bg-[#2F7E6A] text-white text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#63C6A7]" /> Visualizando Este Paciente
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPatient(p.id, p.fullName);
                    }}
                    className="w-full py-2 bg-white hover:bg-[#E9F7F2] text-[#2F7E6A] border-2 border-[#63C6A7] text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5 transition"
                  >
                    Visualizar e Gerenciar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
