import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Medication, PharmaceuticalForm, TimingInstruction } from '../types';
import {
  Pill,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  Check,
  Package,
  Volume2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { audioService } from '../services/audio';
import { openWhatsAppMedicationReminder } from '../utils/whatsapp';

export const MedicationManagement: React.FC = () => {
  const { medications, addMedication, updateMedication, deleteMedication, patient, caregivers } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [dosage, setDosage] = useState('');
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState<PharmaceuticalForm>('Comprimido');
  const [stockQuantity, setStockQuantity] = useState(30);
  const [timeInput, setTimeInput] = useState('08:00');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [selectedInterval, setSelectedInterval] = useState<number | 'custom'>(24);
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [durationOption, setDurationOption] = useState<string>('continuous');
  const [isContinuous, setIsContinuous] = useState(true);
  const [isMedicalPrep, setIsMedicalPrep] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [treatmentDurationDays, setTreatmentDurationDays] = useState(30);
  const [timingInstruction, setTimingInstruction] = useState<TimingInstruction>('Em jejum');
  const [notes, setNotes] = useState('');

  const generateIntervalTimes = (intervalHours: number, startTime: string): string[] => {
    const startStr = startTime || '08:00';
    const parts = startStr.split(':');
    const startH = parseInt(parts[0] || '8', 10);
    const startM = parseInt(parts[1] || '0', 10);

    const times: string[] = [];
    const dosesCount = Math.floor(24 / intervalHours);

    for (let i = 0; i < dosesCount; i++) {
      const totalMinutes = (startH * 60 + startM) + i * (intervalHours * 60);
      const hour = Math.floor((totalMinutes / 60) % 24);
      const min = totalMinutes % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      if (!times.includes(timeStr)) {
        times.push(timeStr);
      }
    }
    return times.sort();
  };

  const applyIntervalSchedule = (interval: number | 'custom', startT: string) => {
    setSelectedInterval(interval);
    if (interval === 'custom') return;
    const times = generateIntervalTimes(interval, startT);
    setScheduledTimes(times);
  };

  const handleFirstDoseTimeChange = (newStartT: string) => {
    setFirstDoseTime(newStartT);
    if (selectedInterval !== 'custom') {
      const times = generateIntervalTimes(selectedInterval, newStartT);
      setScheduledTimes(times);
    }
  };

  const handleDurationOptionChange = (val: string) => {
    setDurationOption(val);
    if (val === 'continuous') {
      setIsContinuous(true);
      setEndDate('');
    } else if (val === 'custom') {
      setIsContinuous(false);
    } else {
      const numDays = Number(val);
      setIsContinuous(false);
      setTreatmentDurationDays(numDays);
      const sDate = startDate ? new Date(startDate) : new Date();
      sDate.setDate(sDate.getDate() + numDays);
      setEndDate(sDate.toISOString().split('T')[0]);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!isContinuous && durationOption !== 'custom') {
      const numDays = Number(durationOption) || treatmentDurationDays;
      const sDate = new Date(newStart);
      sDate.setDate(sDate.getDate() + numDays);
      setEndDate(sDate.toISOString().split('T')[0]);
    }
  };

  const userName = currentUser?.displayName || 'Administrador';

  const resetForm = () => {
    setName('');
    setPhoto('');
    setDosage('');
    setPharmaceuticalForm('Comprimido');
    setStockQuantity(30);
    setSelectedInterval(24);
    setFirstDoseTime('08:00');
    setScheduledTimes(['08:00']);
    setDurationOption('continuous');
    setIsContinuous(true);
    setIsMedicalPrep(false);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTreatmentDurationDays(30);
    setTimingInstruction('Em jejum');
    setNotes('');
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Medication) => {
    setEditingId(m.id);
    setName(m.name);
    setPhoto(m.photo);
    setDosage(m.dosage);
    setPharmaceuticalForm(m.pharmaceuticalForm);
    setStockQuantity(m.stockQuantity);
    setScheduledTimes(m.scheduledTimes);
    if (m.scheduledTimes.length > 0) {
      setFirstDoseTime(m.scheduledTimes[0]);
      if (m.scheduledTimes.length === 6) setSelectedInterval(4);
      else if (m.scheduledTimes.length === 4) setSelectedInterval(6);
      else if (m.scheduledTimes.length === 3) setSelectedInterval(8);
      else if (m.scheduledTimes.length === 2) setSelectedInterval(12);
      else if (m.scheduledTimes.length === 1) setSelectedInterval(24);
      else setSelectedInterval('custom');
    } else {
      setSelectedInterval('custom');
    }
    
    if (m.isContinuous) {
      setDurationOption('continuous');
    } else if (m.treatmentDurationDays && [3, 5, 7, 10, 14, 21, 30, 60, 90].includes(m.treatmentDurationDays)) {
      setDurationOption(String(m.treatmentDurationDays));
    } else {
      setDurationOption('custom');
    }

    setIsContinuous(m.isContinuous);
    setIsMedicalPrep(m.isMedicalPrep || false);
    setStartDate(m.startDate);
    setEndDate(m.endDate || '');
    setTreatmentDurationDays(m.treatmentDurationDays || 30);
    setTimingInstruction(m.timingInstruction);
    setNotes(m.notes);
    setIsModalOpen(true);
  };

  const handleAddTime = () => {
    if (timeInput && !scheduledTimes.includes(timeInput)) {
      setScheduledTimes([...scheduledTimes, timeInput].sort());
    }
  };

  const handleRemoveTime = (t: string) => {
    setScheduledTimes(scheduledTimes.filter((x) => x !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    const payload = {
      name,
      photo: photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
      dosage,
      pharmaceuticalForm,
      stockQuantity,
      scheduledTimes: scheduledTimes.length > 0 ? scheduledTimes : ['08:00'],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startDate,
      endDate: isContinuous ? undefined : endDate,
      treatmentDurationDays: isContinuous ? undefined : treatmentDurationDays,
      isContinuous,
      isMedicalPrep,
      timingInstruction,
      notes,
    };

    if (editingId) {
      updateMedication(editingId, payload, userName);
      setSuccessMsg(`O medicamento "${name}" foi atualizado com sucesso!`);
    } else {
      addMedication(payload, userName);
      setSuccessMsg(`O medicamento "${name}" (${dosage}) foi cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
    resetForm();
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleOpenDeleteModal = (m: Medication) => {
    setDeletingMedication(m);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingMedication) return;
    const medName = deletingMedication.name;
    const medDosage = deletingMedication.dosage;

    deleteMedication(deletingMedication.id, userName);

    setSuccessMsg(
      `O medicamento "${medName}" (${medDosage}) foi excluído com sucesso do tratamento! Todos os registros de ministrações passadas foram mantidos intactos no histórico.`
    );
    setIsDeleteModalOpen(false);
    setDeletingMedication(null);

    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleWhatsAppShare = (m: Medication) => {
    const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty) || caregivers[0];
    const phone = activeCaregiver?.phone || patient.emergencyPhone || '';
    openWhatsAppMedicationReminder(phone, {
      patientName: patient.fullName,
      medicationName: m.name,
      dosage: m.dosage,
      scheduledTime: m.scheduledTimes.join(', '),
      timingInstruction: m.timingInstruction,
    });
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
            className="text-white/80 hover:text-white font-bold text-xs px-2 py-1 hover:bg-emerald-700 rounded-lg transition"
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <Pill className="w-7 h-7 text-[#2F7E6A]" /> Gestão de Medicamentos
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Controle completo de dosagens, horários, estoque, edição, exclusão e orientações médicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Inserir Novo Medicamento
          </button>
        </div>
      </div>

      {/* Medication Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {medications.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm flex flex-col justify-between hover:border-[#63C6A7] transition space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <img
                    src={m.photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'}
                    alt={m.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#63C6A7] shadow"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-[#1F2E2C]">{m.name}</h3>
                      <button
                        onClick={() =>
                          audioService.speakText(
                            `Medicamento ${m.name}, dosagem ${m.dosage}. Orientações: ${m.timingInstruction}`
                          )
                        }
                        className="text-[#2F7E6A] hover:bg-[#E9F7F2] p-1 rounded-lg"
                        title="Ouvir detalhes em áudio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-[#2F7E6A]">{m.dosage}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2.5 py-0.5 bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7] text-xs font-bold rounded-full">
                        {m.pharmaceuticalForm}
                      </span>
                      {m.isMedicalPrep && (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-full flex items-center gap-1">
                          🏥 Preparo Médico
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleWhatsAppShare(m)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Notificar Responsável via WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl transition"
                    title="Editar medicamento (Lápis)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(m)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Excluir medicamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Schedules & Timing Details */}
              <div className="mt-4 pt-4 border-t border-[#BFE8D6] space-y-2 text-xs text-[#1F2E2C]">
                <div className="flex items-center justify-between text-xs bg-[#E9F7F2] p-2 rounded-xl border border-[#63C6A7]">
                  <span className="font-extrabold text-[#2F7E6A] flex items-center gap-1">
                    📅 Data de Início:
                  </span>
                  <span className="font-black text-[#1F2E2C]">
                    {new Date(m.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-bold">
                  <Clock className="w-4 h-4 text-[#2F7E6A]" /> Horários de Tomada:
                  <div className="flex flex-wrap gap-1">
                    {m.scheduledTimes.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#2F7E6A] text-white font-black rounded-md shadow-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-gray-600">Instrução de Tomada:</span>
                  <span className="font-bold text-[#2F7E6A] bg-[#BFE8D6]/60 px-2 py-0.5 rounded-md">
                    {m.timingInstruction}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Tratamento:</span>
                  <span className="font-bold text-[#1F2E2C]">
                    {m.isContinuous ? 'Uso Contínuo' : `Temporário (${m.treatmentDurationDays || 30} dias)`}
                  </span>
                </div>

                {m.notes && (
                  <p className="text-xs text-gray-600 bg-[#E9F7F2] p-2.5 rounded-xl border border-[#63C6A7] italic">
                    "{m.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Stock Quantity Badge */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-gray-700">
                <Package className="w-4 h-4 text-[#2F7E6A]" /> Estoque Restante:
              </span>
              <span
                className={`font-black px-3 py-1 rounded-full ${
                  m.stockQuantity <= 5
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : 'bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7]'
                }`}
              >
                {m.stockQuantity} unidades
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6]">
              {editingId ? 'Editar Medicamento' : 'Cadastrar Novo Medicamento'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    📅 Data de Início do Medicamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  />
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-white border-2 border-[#63C6A7] rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={isMedicalPrep}
                      onChange={(e) => setIsMedicalPrep(e.target.checked)}
                      className="w-4 h-4 accent-[#2F7E6A] rounded"
                    />
                    <span className="text-xs font-extrabold text-[#1F2E2C]">
                      🏥 Marcar como Preparo Médico / Procedimento
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Nome do Medicamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Losartana Potássica"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Dosagem *
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 50mg - 1 comprimido"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Forma Farmacêutica
                  </label>
                  <select
                    value={pharmaceuticalForm}
                    onChange={(e) => setPharmaceuticalForm(e.target.value as any)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  >
                    <option value="Comprimido">Comprimido</option>
                    <option value="Gotas">Gotas</option>
                    <option value="Pomada">Pomada</option>
                    <option value="Injeção">Injeção</option>
                    <option value="Cápsula">Cápsula</option>
                    <option value="Xarope">Xarope</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Orientação de Tomada
                  </label>
                  <select
                    value={timingInstruction}
                    onChange={(e) => setTimingInstruction(e.target.value as any)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  >
                    <option value="Antes da refeição">Antes da refeição</option>
                    <option value="Depois da refeição">Depois da refeição</option>
                    <option value="Em jejum">Em jejum</option>
                    <option value="Durante a refeição">Durante a refeição</option>
                    <option value="Indiferente">Indiferente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                    Duração do Tratamento (Quantidade de Dias) *
                  </label>
                  <select
                    value={durationOption}
                    onChange={(e) => handleDurationOptionChange(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                  >
                    <option value="continuous">Uso Contínuo (Sem término pré-definido)</option>
                    <option value="3">3 Dias de Tratamento</option>
                    <option value="5">5 Dias de Tratamento</option>
                    <option value="7">7 Dias (1 Semana)</option>
                    <option value="10">10 Dias de Tratamento</option>
                    <option value="14">14 Dias (2 Semanas)</option>
                    <option value="21">21 Dias (3 Semanas)</option>
                    <option value="30">30 Dias (1 Mês)</option>
                    <option value="60">60 Dias (2 Meses)</option>
                    <option value="90">90 Dias (3 Meses)</option>
                    <option value="custom">Quantidade Personalizada de Dias...</option>
                  </select>
                </div>

                {durationOption === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                      Quantidade de Dias Específica *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={treatmentDurationDays}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        setTreatmentDurationDays(num);
                        const sDate = startDate ? new Date(startDate) : new Date();
                        sDate.setDate(sDate.getDate() + num);
                        setEndDate(sDate.toISOString().split('T')[0]);
                      }}
                      className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold text-[#1F2E2C]"
                    />
                  </div>
                )}
              </div>

              {/* Scheduled Times Picker with Dropdown Select & First Dose */}
              <div className="p-4 bg-white rounded-2xl border-2 border-[#63C6A7] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] mb-1.5">
                      Horário de Tomada / Intervalo Médico *
                    </label>
                    <select
                      value={selectedInterval}
                      onChange={(e) => {
                        const val = e.target.value === 'custom' ? 'custom' : Number(e.target.value);
                        applyIntervalSchedule(val as any, firstDoseTime);
                      }}
                      className="w-full p-3 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-bold text-[#1F2E2C]"
                    >
                      <option value="4">De 4 em 4 horas (6 tomadas por dia)</option>
                      <option value="6">De 6 em 6 horas (4 tomadas por dia)</option>
                      <option value="8">De 8 em 8 horas (3 tomadas por dia)</option>
                      <option value="12">De 12 em 12 horas (2 tomadas por dia)</option>
                      <option value="24">De 24 em 24 horas (1 tomada por dia)</option>
                      <option value="48">De 48 em 48 horas (A cada 2 dias)</option>
                      <option value="custom">Personalizado (Horários Manuais)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] mb-1.5">
                      Horário da 1ª Dose (Início do Ciclo) *
                    </label>
                    <input
                      type="time"
                      value={firstDoseTime}
                      onChange={(e) => handleFirstDoseTimeChange(e.target.value)}
                      className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-bold text-[#1F2E2C]"
                    />
                  </div>
                </div>

                  {selectedInterval === 'custom' && (
                    <div>
                      <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                        Adicionar Horário Específico
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={timeInput}
                          onChange={(e) => setTimeInput(e.target.value)}
                          className="p-2 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-bold text-[#1F2E2C]"
                        />
                        <button
                          type="button"
                          onClick={handleAddTime}
                          className="px-3 py-2 bg-[#2F7E6A] text-white font-bold rounded-xl text-xs hover:bg-[#256555]"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1.5">
                    Horários Configurados ({scheduledTimes.length} tomada(s)):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {scheduledTimes.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#2F7E6A] text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                      >
                        ⏰ Dose {idx + 1}: {t}
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveTime(t);
                            setSelectedInterval('custom');
                          }}
                          className="hover:text-rose-200 font-bold ml-1 text-sm"
                          title="Remover este horário"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* URL Photo */}
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                  URL da Foto do Medicamento (Opcional)
                </label>
                <input
                  type="url"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://exemplo.com/foto-comprimido.jpg"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs text-[#1F2E2C]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                  Observações de Uso
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Tomar com água. Evitar ingerir com leite..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs text-[#1F2E2C]"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black rounded-xl text-xs shadow-md"
                >
                  Salvar Medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialogue: Confirm Deletion of Medication */}
      {isDeleteModalOpen && deletingMedication && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-rose-500 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Trash2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Excluir Medicamento</h3>
                <p className="text-xs font-bold text-rose-600">Caixa de Diálogo de Confirmação</p>
              </div>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
              <p className="text-sm font-extrabold text-gray-900">
                Tem certeza de que deseja remover este medicamento do tratamento?
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1">
                <p className="font-black text-base text-[#1F2E2C]">{deletingMedication.name}</p>
                <p className="text-xs font-bold text-[#2F7E6A]">Dosagem: {deletingMedication.dosage}</p>
                <p className="text-xs font-semibold text-gray-600">
                  Forma: {deletingMedication.pharmaceuticalForm} | Horários: {deletingMedication.scheduledTimes.join(', ')}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Garantia de Histórico e Auditoria</span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                A exclusão interrompe os alarmes e retira o medicamento do plano ativo, mas <strong>mantém salvos todos os registros</strong> de doses que já foram administradas no histórico de cuidados.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingMedication(null);
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
