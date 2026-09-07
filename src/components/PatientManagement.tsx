import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Patient, CaregiverRelation } from '../types';
import {
  User,
  Heart,
  Phone,
  AlertOctagon,
  FileText,
  MapPin,
  Calendar,
  Edit2,
  Check,
  Shield,
  Activity,
  Droplet,
  Plus,
  Search,
  Printer,
  Clock,
  UserCheck,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Users,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const PatientManagement: React.FC = () => {
  const {
    patients,
    activePatientId,
    patient,
    selectPatientById,
    addPatient,
    updatePatient,
    deletePatient,
    perspectiveRole,
    setPerspectiveRole,
    historyLogs,
    schedules,
    caregivers,
    activeCaregiverOnDuty,
  } = useApp();

  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [activeTab, setActiveTab] = useState<'ficha' | 'log' | 'relatorio'>('ficha');

  const userName = currentUser?.displayName || 'Administrador';

  // Form states for edit or add
  const [formData, setFormData] = useState<Patient>(patient);
  const [newPatientId, setNewPatientId] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newDisease, setNewDisease] = useState('');

  // Filter logs for the active patient
  const patientLogs = historyLogs.filter(
    (log) =>
      log.description.toLowerCase().includes(patient.fullName.toLowerCase()) ||
      log.description.toLowerCase().includes(patient.id.toLowerCase()) ||
      log.actionType === 'administracao' ||
      log.actionType === 'medicamento_esquecido'
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient(patient.id, formData, userName);
    setIsEditing(false);
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const customId = newPatientId.trim() ? newPatientId.trim().toUpperCase() : `PAC-${Math.floor(1000 + Math.random() * 9000)}`;
    addPatient({ ...formData, id: customId }, userName);
    setIsAddingNewPatient(false);
    setNewPatientId('');
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, newAllergy.trim()] });
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (a: string) => {
    setFormData({ ...formData, allergies: formData.allergies.filter((x) => x !== a) });
  };

  const handleAddDisease = () => {
    if (newDisease.trim() && !formData.diseases.includes(newDisease.trim())) {
      setFormData({ ...formData, diseases: [...formData.diseases, newDisease.trim()] });
      setNewDisease('');
    }
  };

  const handleRemoveDisease = (d: string) => {
    setFormData({ ...formData, diseases: formData.diseases.filter((x) => x !== d) });
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ADMINISTRATOR PROFILE - ALL REGISTERED PATIENT IDs VIEW */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 border-3 border-[#2F7E6A] shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BFE8D6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#2F7E6A] text-white font-extrabold text-xs rounded-lg flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#BFE8D6]" /> PAINEL DO ADMINISTRADOR
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Total de IDs Registrados: {patients.length}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1F2E2C] mt-1">
                Lista Geral de Pacientes Cadastrados por ID
              </h2>
            </div>

            <button
              onClick={() => {
                setFormData({
                  id: '',
                  fullName: '',
                  cpf: '',
                  birthDate: new Date().toISOString().split('T')[0],
                  phone: '',
                  emergencyPhone: '',
                  address: '',
                  photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
                  bloodType: 'O+',
                  weight: 65,
                  height: 1.60,
                  allergies: [],
                  diseases: [],
                  notes: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setIsAddingNewPatient(true);
              }}
              className="px-4 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Novo Paciente (ID)
            </button>
          </div>

          {/* Patient IDs Grid Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {patients.map((p) => {
              const isActive = p.id === activePatientId;
              return (
                <div
                  key={p.id}
                  onClick={() => selectPatientById(p.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-[#2F7E6A] bg-[#E9F7F2] ring-2 ring-[#63C6A7] shadow-sm'
                      : 'border-[#BFE8D6] bg-white hover:border-[#63C6A7]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                      alt={p.fullName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#63C6A7]"
                    />
                    <div>
                      <span className="px-2 py-0.5 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md tracking-wider">
                        ID: {p.id}
                      </span>
                      <h4 className="text-xs font-black text-[#1F2E2C] truncate max-w-[160px] mt-0.5">
                        {p.fullName}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-500">CPF: {p.cpf}</p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="p-1 bg-[#2F7E6A] text-white rounded-full">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remover paciente ID: ${p.id}?`)) {
                          deletePatient(p.id, userName);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                      title="Excluir paciente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MULTI-ROLE PERSPECTIVE SWITCHER TABS */}
      <div className="bg-[#E9F7F2] p-4 rounded-3xl border-2 border-[#BFE8D6] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#2F7E6A] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Modos de Visualização por Perfil / Papel de Acesso:
          </span>
          <span className="text-[11px] font-semibold text-gray-600">
            Paciente Atual Selecionado: <strong className="text-[#2F7E6A]">{patient.fullName} (ID: {patient.id})</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setPerspectiveRole('paciente')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              perspectiveRole === 'paciente'
                ? 'bg-[#2F7E6A] text-white shadow-md'
                : 'bg-white text-[#1F2E2C] border border-[#BFE8D6] hover:bg-[#BFE8D6]/30'
            }`}
          >
            👵 Visão Paciente
          </button>
          <button
            onClick={() => setPerspectiveRole('curador')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              perspectiveRole === 'curador'
                ? 'bg-[#2F7E6A] text-white shadow-md'
                : 'bg-white text-[#1F2E2C] border border-[#BFE8D6] hover:bg-[#BFE8D6]/30'
            }`}
          >
            📜 Visão Curador
          </button>
          <button
            onClick={() => setPerspectiveRole('enfermeiro')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              perspectiveRole === 'enfermeiro'
                ? 'bg-[#2F7E6A] text-white shadow-md'
                : 'bg-white text-[#1F2E2C] border border-[#BFE8D6] hover:bg-[#BFE8D6]/30'
            }`}
          >
            🩺 Visão Enfermeiro / Cuidador
          </button>
          <button
            onClick={() => setPerspectiveRole('filhos')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
              perspectiveRole === 'filhos'
                ? 'bg-[#2F7E6A] text-white shadow-md'
                : 'bg-white text-[#1F2E2C] border border-[#BFE8D6] hover:bg-[#BFE8D6]/30'
            }`}
          >
            👨‍👩‍👧 Visão Filhos / Família
          </button>
        </div>
      </div>

      {/* PATIENT HEADER & TAB SELECTOR (FICHA MEDICA, MENU DE LOG, RELATORIO DIARIO) */}
      <div className="bg-white p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={patient.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'}
            alt={patient.fullName}
            className="w-16 h-16 rounded-full object-cover border-4 border-[#63C6A7] shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#2F7E6A] text-white font-black text-xs rounded-md">
                ID: {patient.id}
              </span>
              <span className="text-xs font-bold text-[#2F7E6A]">CPF: {patient.cpf}</span>
            </div>
            <h2 className="text-2xl font-black text-[#1F2E2C] mt-0.5">{patient.fullName}</h2>
            <p className="text-xs text-gray-500 font-semibold">
              Emergência: <strong className="text-rose-700">{patient.emergencyPhone}</strong> • Endereço: {patient.address}
            </p>
          </div>
        </div>

        {/* Inner Tabs: Ficha Médica | Menu de Log | Relatório Diário */}
        <div className="flex items-center gap-2 bg-[#E9F7F2] p-1.5 rounded-2xl border border-[#BFE8D6] shrink-0">
          <button
            onClick={() => setActiveTab('ficha')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'ficha'
                ? 'bg-[#2F7E6A] text-white shadow'
                : 'text-[#1F2E2C] hover:bg-[#BFE8D6]/40'
            }`}
          >
            📋 Ficha Completa
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeTab === 'log'
                ? 'bg-[#2F7E6A] text-white shadow'
                : 'text-[#1F2E2C] hover:bg-[#BFE8D6]/40'
            }`}
          >
            📜 Menu de Log ({patientLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('relatorio')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              activeTab === 'relatorio'
                ? 'bg-[#2F7E6A] text-white shadow'
                : 'text-[#1F2E2C] hover:bg-[#BFE8D6]/40'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Relatório Diário
          </button>
        </div>
      </div>

      {/* TAB 1: FICHA COMPLETA DO PACIENTE */}
      {activeTab === 'ficha' && !isEditing && !isAddingNewPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vitals & Summary */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4 text-center">
            <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl text-left space-y-1">
              <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                <Phone className="w-4 h-4 animate-bounce" /> Contato de Emergência
              </span>
              <p className="text-xl font-black text-rose-800">{patient.emergencyPhone}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#E9F7F2] p-3 rounded-2xl border border-[#63C6A7]">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Tipo Sanguíneo</span>
                <span className="text-xl font-black text-[#2F7E6A] flex items-center justify-center gap-1">
                  <Droplet className="w-4 h-4 fill-[#63C6A7]" /> {patient.bloodType}
                </span>
              </div>
              <div className="bg-[#E9F7F2] p-3 rounded-2xl border border-[#63C6A7]">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Data Nasc.</span>
                <span className="text-xs font-black text-[#1F2E2C]">
                  {new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="bg-[#E9F7F2] p-3 rounded-2xl border border-[#63C6A7]">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Peso</span>
                <span className="text-sm font-black text-[#1F2E2C]">{patient.weight} kg</span>
              </div>
              <div className="bg-[#E9F7F2] p-3 rounded-2xl border border-[#63C6A7]">
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Altura</span>
                <span className="text-sm font-black text-[#1F2E2C]">{patient.height} m</span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setFormData(patient);
                  setIsEditing(true);
                }}
                className="w-full py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Editar Ficha Médica do Paciente
              </button>
            )}
          </div>

          {/* Medical Record & Allergies */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-2 mb-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" /> Alergias Registradas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-xs rounded-xl shadow-xs"
                    >
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-[#2F7E6A]" /> Condições Médicas & Doenças Crônicas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.diseases.map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7] font-extrabold text-xs rounded-xl"
                    >
                      🩺 {d}
                    </span>
                  ))}
                </div>
              </div>

              {patient.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="font-bold text-gray-700 text-xs mb-1">Observações Médicas e Recomendações:</h4>
                  <p className="text-xs text-[#1F2E2C] bg-[#E9F7F2] p-3.5 rounded-xl border border-[#BFE8D6] leading-relaxed font-medium">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU DE LOG DENTRO DO PACIENTE */}
      {activeTab === 'log' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BFE8D6]">
            <div>
              <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#2F7E6A]" /> Menu de Log e Controle de Administração
              </h3>
              <p className="text-xs text-[#2F7E6A] font-semibold mt-0.5">
                Histórico de quem administrou a medicação do paciente ID: {patient.id} e em qual horário exato
              </p>
            </div>

            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-[#63C6A7] text-[#1F2E2C] font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
            >
              <Printer className="w-4 h-4" /> Imprimir Histórico de Logs
            </button>
          </div>

          {patientLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-medium text-sm">
              Nenhum registro de administração efetuado para este paciente até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {patientLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-[#BFE8D6] bg-[#E9F7F2]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#E9F7F2] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#2F7E6A] text-white font-extrabold text-[11px] rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dose Registrada
                      </span>
                      <span className="text-xs font-black text-[#1F2E2C]">
                        Responsável: {log.userName}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#1F2E2C]">{log.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-[#2F7E6A] flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RELATÓRIO DIÁRIO DE DOSES PARA FAMILIARES / CURADOR */}
      {activeTab === 'relatorio' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4 print:p-[#0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#BFE8D6]">
            <div>
              <span className="px-2.5 py-1 bg-[#2F7E6A] text-white font-extrabold text-[10px] rounded-md uppercase">
                Relatório Diário Oficial
              </span>
              <h3 className="text-2xl font-black text-[#1F2E2C] mt-1">
                Relatório de Doses Administradas ao Paciente
              </h3>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Paciente: <strong>{patient.fullName} (ID: {patient.id})</strong> • Emissor: CuidadoSenior App
              </p>
            </div>

            <button
              onClick={handlePrintReport}
              className="px-5 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 shrink-0 print:hidden"
            >
              <Printer className="w-4 h-4" /> Imprimir Relatório Diário
            </button>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#E9F7F2] rounded-2xl border border-[#63C6A7]">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Responsável em Plantão</span>
              <span className="text-sm font-black text-[#2F7E6A]">
                {activeCaregiverOnDuty ? `${activeCaregiverOnDuty.name} (${activeCaregiverOnDuty.relationship})` : 'João Oliveira (Cuidador)'}
              </span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Status da Rotina</span>
              <span className="text-sm font-black text-emerald-900">100% Notificado aos Familiares</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Lembretes & Atrasos</span>
              <span className="text-sm font-black text-amber-900">Alerta Imediato via SMS/App Ativado</span>
            </div>
          </div>

          {/* Medication Table */}
          <div className="border border-[#BFE8D6] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E9F7F2] text-[#1F2E2C] font-black uppercase text-[10px]">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Medicamento / Dose</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Quem Administrou</th>
                  <th className="p-3">Horário Efetivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#2F7E6A]">{s.scheduledTime}</td>
                    <td className="p-3 font-semibold">{s.medicationName} ({s.dosage})</td>
                    <td className="p-3">
                      {s.status === 'administered' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-[10px]">
                          ✓ Administrado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded-md text-[10px]">
                          ⏳ Pendente / Atrasado
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium">{s.administeredBy || 'Pendente'} ({s.responsibleRole || 'N/A'})</td>
                    <td className="p-3 font-medium">{s.administeredAt || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PATIENT FORM MODAL / SECTION */}
      {isEditing && (
        <form onSubmit={handleSaveEdit} className="bg-white p-6 rounded-3xl border-2 border-[#BFE8D6] shadow-md space-y-4">
          <h3 className="text-xl font-black text-[#1F2E2C] pb-2 border-b border-[#BFE8D6]">
            Editar Ficha do Paciente (ID: {formData.id})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CPF *</label>
              <input
                type="text"
                required
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Data Nasc. *</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">Emergência *</label>
              <input
                type="text"
                required
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full p-2.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs font-bold text-rose-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Tipo Sanguíneo</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">URL Foto</label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2F7E6A] text-white font-extrabold text-xs rounded-xl shadow"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* ADD NEW PATIENT MODAL */}
      {isAddingNewPatient && (
        <form onSubmit={handleCreatePatient} className="bg-white p-6 rounded-3xl border-3 border-[#63C6A7] shadow-xl space-y-4">
          <h3 className="text-xl font-black text-[#1F2E2C] pb-2 border-b border-[#BFE8D6] flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#2F7E6A]" /> Cadastrar Novo Paciente no Banco de Dados
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">ID do Paciente (Ex: PAC-9900)</label>
              <input
                type="text"
                placeholder="Auto-gerado se em branco"
                value={newPatientId}
                onChange={(e) => setNewPatientId(e.target.value)}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Sr. José da Silva"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Data de Nascimento *</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">Telefone de Emergência *</label>
              <input
                type="text"
                required
                placeholder="(11) 99999-8888"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full p-2.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs font-bold text-rose-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Endereço Residencial</label>
              <input
                type="text"
                placeholder="Rua, número, cidade..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
            <button
              type="button"
              onClick={() => setIsAddingNewPatient(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#2F7E6A] text-white font-extrabold text-xs rounded-xl shadow"
            >
              Confirmar Cadastro por ID
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
