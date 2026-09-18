import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, CaregiverRelation, MedicalAppointment } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Info,
  MessageCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  X,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Stethoscope,
  MapPin,
  Paperclip,
  Volume2,
  Plus,
} from 'lucide-react';
import {
  openWhatsAppMedicationReminder,
  openWhatsAppAppointmentReminder,
  openWhatsAppCuratorAlert,
  openWhatsAppDailyReport,
} from '../utils/whatsapp';
import { audioService } from '../services/audio';

export const SmartCalendar: React.FC = () => {
  const {
    schedules,
    medications,
    medicalAppointments,
    addMedicalAppointment,
    patient,
    caregivers,
    confirmScheduleAdministered,
    markScheduleNotAdministered,
    regenerateSchedulesForDates,
    toggleScheduleSoundAlarm,
    toggleMedicationSoundAlarm,
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Appointment / Exam inside Calendar Dialog State
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [newAppType, setNewAppType] = useState<'consulta' | 'exame'>('exame');
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppDoctor, setNewAppDoctor] = useState('');
  const [newAppSpecialty, setNewAppSpecialty] = useState('');
  const [newAppTime, setNewAppTime] = useState('09:00');
  const [newAppAddress, setNewAppAddress] = useState('');
  const [newAppPrep, setNewAppPrep] = useState('');

  // Inline administration form states for dialog
  const [administeringItemId, setAdministeringItemId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<CaregiverRelation | 'Paciente'>('Cuidador');
  const [adminName, setAdminName] = useState('');
  const [adminTime, setAdminTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Inline missed form states
  const [missingItemId, setMissingItemId] = useState<string | null>(null);
  const [missingReason, setMissingReason] = useState('');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDayString = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  // Automatically trigger schedule generation for all days in the currently viewed month
  useEffect(() => {
    const datesToRegenerate: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      datesToRegenerate.push(formatDayString(d));
    }
    regenerateSchedulesForDates(datesToRegenerate);
  }, [year, month, medications.length]);

  const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty) || caregivers[0];
  const curatorOrFamily =
    caregivers.find(
      (c) =>
        c.relationship === 'Curador' ||
        c.relationship === 'Filho' ||
        c.relationship === 'Filha' ||
        c.relationship === 'Esposa' ||
        c.relationship === 'Marido'
    ) || caregivers.find((c) => c.receiveNotifications) || caregivers[0];

  const curatorPhone = curatorOrFamily?.phone || patient.emergencyPhone || '';

  const handleWhatsAppShare = (item: ScheduleItem) => {
    const phone = activeCaregiver?.phone || patient.emergencyPhone || '';
    openWhatsAppMedicationReminder(phone, {
      patientName: patient.fullName,
      medicationName: item.medicationName,
      dosage: item.dosage,
      scheduledTime: item.scheduledTime,
      timingInstruction: item.timingInstruction,
    });
  };

  const handleWhatsAppAppointmentShare = (app: MedicalAppointment) => {
    const phone = activeCaregiver?.phone || patient.emergencyPhone || '';
    openWhatsAppAppointmentReminder(phone, {
      patientName: patient.fullName,
      appointmentTitle: app.title,
      appointmentType: app.type,
      doctorOrClinic: app.doctorOrClinic,
      dateTime: new Date(app.dateTime).toLocaleString('pt-BR'),
      prepInstructions: app.prepInstructions,
    });
  };

  const handleSpeakAppointment = (app: MedicalAppointment) => {
    const isExame = app.type === 'exame';
    const dateFormatted = new Date(app.dateTime).toLocaleString('pt-BR');
    const prepText = app.prepInstructions ? `. Preparo necessário: ${app.prepInstructions}` : '';
    const text = `Lembrete de ${isExame ? 'exame' : 'consulta'}: ${app.title} agendado para ${dateFormatted} em ${app.doctorOrClinic}${prepText}`;
    audioService.speakText(text);
  };

  const handleSendCuratorAlert = (item: ScheduleItem) => {
    openWhatsAppCuratorAlert(curatorPhone, {
      curatorName: curatorOrFamily?.name || 'Curador / Familiar',
      patientName: patient.fullName,
      medicationName: item.medicationName,
      dosage: item.dosage,
      scheduledTime: item.scheduledTime,
      scheduledDate: item.scheduledDate,
      status: item.status === 'missed' ? 'missed' : 'delayed',
      reason: item.reasonNotAdministered,
    });
  };

  const handleSendDailyReportToCurator = () => {
    const items = selectedDaySchedules.map((s) => ({
      time: s.scheduledTime,
      medicationName: s.medicationName,
      dosage: s.dosage,
      status: s.status,
      administeredBy: s.administeredBy,
      responsibleRole: s.responsibleRole,
      administeredAt: s.administeredAt,
      reasonNotAdministered: s.reasonNotAdministered,
    }));

    openWhatsAppDailyReport(curatorPhone, {
      curatorName: curatorOrFamily?.name || 'Curador / Familiar',
      patientName: patient.fullName,
      dateStr: selectedDateStr,
      items,
    });
  };

  const startAdministering = (item: ScheduleItem) => {
    setAdministeringItemId(item.id);
    setMissingItemId(null);
    setAdminRole('Cuidador');
    setAdminName(activeCaregiver?.name || 'Cuidador Responsável');
    const nowHHMM = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setAdminTime(nowHHMM);
    setAdminNotes('');
  };

  const submitAdminister = (itemId: string) => {
    const nameToUse = adminName.trim() || activeCaregiver?.name || 'Cuidador';
    confirmScheduleAdministered(itemId, nameToUse, adminRole, adminNotes);
    setAdministeringItemId(null);
  };

  const startMarkingMissed = (item: ScheduleItem) => {
    setMissingItemId(item.id);
    setAdministeringItemId(null);
    setMissingReason('');
  };

  const submitMarkingMissed = (item: ScheduleItem) => {
    const reasonToUse = missingReason.trim() || 'Não ministrado / Recusou';
    const nameToUse = activeCaregiver?.name || 'Cuidador';

    markScheduleNotAdministered(item.id, reasonToUse, nameToUse);
    setMissingItemId(null);

    if (confirm('Deseja notificar o Curador/Familiar sobre este esquecimento via WhatsApp agora?')) {
      handleSendCuratorAlert({
        ...item,
        status: 'missed',
        reasonNotAdministered: reasonToUse,
      });
    }
  };

  const handleSaveNewAppointmentInCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppTitle || !newAppDoctor) return;

    const fullDateTime = `${selectedDateStr}T${newAppTime}`;

    addMedicalAppointment(
      {
        type: newAppType,
        title: newAppTitle,
        specialtyOrExam: newAppSpecialty || (newAppType === 'exame' ? 'Exame Laboratorial' : 'Consulta Médica'),
        doctorOrClinic: newAppDoctor,
        addressOrLocation: newAppAddress,
        dateTime: fullDateTime,
        prepInstructions: newAppPrep,
        status: 'agendado',
      },
      activeCaregiver?.name || 'Cuidador'
    );

    audioService.playSuccessChime();
    audioService.speakText(
      `${newAppType === 'exame' ? 'Exame' : 'Consulta'} ${newAppTitle} agendado para o dia ${new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR')} e adicionado ao Calendário!`
    );

    setIsAddingAppointment(false);
    setNewAppTitle('');
    setNewAppDoctor('');
    setNewAppSpecialty('');
    setNewAppAddress('');
    setNewAppPrep('');
  };

  // Get day categories and counts for color separation
  const getDayDetails = (dateStr: string) => {
    const dayMeds = schedules.filter((s) => s.scheduledDate === dateStr);
    const dayApps = medicalAppointments.filter((a) => a.dateTime.split('T')[0] === dateStr);

    const consultas = dayApps.filter((a) => a.type === 'consulta');
    const exames = dayApps.filter((a) => a.type === 'exame');

    // Check if there are continuous medications for this day
    const prepMeds = medications.filter(
      (m) =>
        (m.isContinuous || m.isMedicalPrep) &&
        (m.startDate <= dateStr || (!m.startDate && dateStr === new Date().toISOString().split('T')[0]))
    );

    const hasMeds = dayMeds.length > 0;
    const hasConsultas = consultas.length > 0;
    const hasExames = exames.length > 0;
    const hasPreps = prepMeds.length > 0;

    return {
      dayMeds,
      dayApps,
      consultas,
      exames,
      prepMeds,
      hasMeds,
      hasConsultas,
      hasExames,
      hasPreps,
    };
  };

  const selectedDayDetails = getDayDetails(selectedDateStr);
  const selectedDaySchedules = selectedDayDetails.dayMeds;

  const selectedDateFormatted = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const countAdministered = selectedDaySchedules.filter((s) => s.status === 'administered').length;
  const countMissed = selectedDaySchedules.filter((s) => s.status === 'missed').length;
  const countPending = selectedDaySchedules.filter((s) => s.status === 'pending' || s.status === 'delayed').length;

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-[#2F7E6A]" /> Calendário Inteligente de Saúde
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Organização por cores: Medicamentos, Consultas, Exames e Medicamentos de uso contínuo. Clique em qualquer dia para ver os detalhes ou agendar.
          </p>
        </div>

        {/* Color Separation Legend Mandate */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-2xl border border-[#BFE8D6] text-xs font-bold text-[#1F2E2C] shadow-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl">
            💊 <strong>Verde:</strong> Medicamentos
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-300 rounded-xl">
            🩺 <strong>Azul:</strong> Consultas
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-300 rounded-xl">
            🔬 <strong>Roxo:</strong> Exames
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl">
            🔄 <strong>Âmbar:</strong> Medicamento de uso contínuo
          </span>
        </div>
      </div>

      {/* Future Continuous & Programmed Medications Section */}
      {medications.some((m) => m.isContinuous || m.isMedicalPrep || (m.startDate && m.startDate > new Date().toISOString().split('T')[0])) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-3xl border-2 border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> 🔄 Medicamentos de Uso Contínuo & Agendamentos Programados
            </h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full">
              {medications.filter((m) => m.isContinuous || m.isMedicalPrep || (m.startDate && m.startDate > new Date().toISOString().split('T')[0])).length} Programado(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {medications
              .filter((m) => m.isContinuous || m.isMedicalPrep || (m.startDate && m.startDate > new Date().toISOString().split('T')[0]))
              .map((prep) => {
                const prepStartStr = prep.startDate;
                const formattedStart = new Date(prepStartStr + 'T00:00:00').toLocaleDateString('pt-BR');

                return (
                  <div key={prep.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-[#1F2E2C]">{prep.name}</span>
                        {(prep.isContinuous || prep.isMedicalPrep) && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                            Uso Contínuo
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#2F7E6A]">{prep.dosage} • {prep.pharmaceuticalForm}</p>

                      <div className="mt-2 text-xs text-gray-700 space-y-1 bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                        <p className="font-bold text-amber-900 flex items-center gap-1">
                          📅 Início: {formattedStart}
                        </p>
                        <p className="font-semibold text-gray-600">
                          ⏰ Doses: {prep.scheduledTimes.join(', ')}
                        </p>
                        <p className="font-semibold text-gray-600">
                          ⏳ Duração: {prep.isContinuous ? 'Medicamento de uso contínuo' : `${prep.treatmentDurationDays || 30} dias de tratamento`}
                        </p>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-600">Alarme Sonoro:</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMedicationSoundAlarm(prep.id);
                            }}
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-black transition ${
                              prep.soundAlarmEnabled !== false
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                          >
                            {prep.soundAlarmEnabled !== false ? '🔔 Ativo' : '🔕 Mudo'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const targetDate = new Date(prepStartStr + 'T00:00:00');
                        setCurrentMonth(targetDate);
                        handleDayClick(prepStartStr);
                      }}
                      className="w-full mt-2 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition"
                    >
                      Abrir Caixa de Diálogo <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4">
          {/* Calendar Month Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6]">
            <h3 className="text-xl font-black text-[#1F2E2C]">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-[#E9F7F2] hover:bg-[#BFE8D6] text-[#2F7E6A] rounded-xl font-bold transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 bg-[#2F7E6A] text-white text-xs font-bold rounded-xl shadow transition"
              >
                Hoje
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 bg-[#E9F7F2] hover:bg-[#BFE8D6] text-[#2F7E6A] rounded-xl font-bold transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-[#2F7E6A] uppercase tracking-wider">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty_${idx}`} className="h-24 sm:h-28 rounded-2xl bg-gray-50/50 border border-gray-100"></div>
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDayString(dayNum);
              const details = getDayDetails(dateStr);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-24 sm:h-28 p-1.5 sm:p-2 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between bg-white hover:border-[#63C6A7] ${
                    isSelected ? 'ring-3 ring-[#2F7E6A] ring-offset-2 scale-[1.03] z-10 shadow-md border-[#2F7E6A]' : 'border-gray-200'
                  } ${isToday ? 'border-l-4 border-l-[#2F7E6A] bg-[#E9F7F2]/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-black ${isToday ? 'px-1.5 py-0.5 bg-[#2F7E6A] text-white rounded-md' : 'text-[#1F2E2C]'}`}>
                      {dayNum}
                    </span>
                  </div>

                  {/* Color-Coded Event Badges per Category */}
                  <div className="space-y-1 my-auto">
                    {/* 1. Consultas (Blue) */}
                    {details.consultas.length > 0 && (
                      <div className="text-[9px] font-black bg-blue-100 text-blue-900 border border-blue-300 rounded-md px-1 py-0.5 truncate flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                        🩺 {details.consultas.length} {details.consultas.length === 1 ? 'Consulta' : 'Consultas'}
                      </div>
                    )}

                    {/* 2. Exames (Purple) */}
                    {details.exames.length > 0 && (
                      <div className="text-[9px] font-black bg-purple-100 text-purple-900 border border-purple-300 rounded-md px-1 py-0.5 truncate flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                        🔬 {details.exames.length} {details.exames.length === 1 ? 'Exame' : 'Exames'}
                      </div>
                    )}

                    {/* 3. Medicamento de uso contínuo (Amber) */}
                    {details.hasPreps && (
                      <div className="text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-md px-1 py-0.5 truncate flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                        🔄 Uso Contínuo
                      </div>
                    )}

                    {/* 4. Medicamentos (Green) */}
                    {details.dayMeds.length > 0 && (
                      <div className="text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md px-1 py-0.5 truncate flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                        💊 {details.dayMeds.length} Med.
                      </div>
                    )}

                    {!details.hasMeds && !details.hasConsultas && !details.hasExames && !details.hasPreps && (
                      <span className="text-[10px] text-gray-300 block text-center">Livre</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Inspector Side Panel */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4 flex flex-col">
          <div className="pb-3 border-b border-[#BFE8D6] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#2F7E6A] uppercase tracking-wider block">
                Resumo do Dia Selecionado
              </span>
              <h3 className="text-lg font-black text-[#1F2E2C] capitalize">
                {selectedDateFormatted}
              </h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-[#2F7E6A] hover:bg-[#256656] text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir Diálogo
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {/* Consultas Side Card */}
            {selectedDayDetails.consultas.map((app) => (
              <div key={app.id} className="bg-blue-50 p-3.5 rounded-2xl border-2 border-blue-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md">
                    🩺 CONSULTA MÉDICA
                  </span>
                  <span className="text-xs font-black text-blue-900">
                    {new Date(app.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-sm font-black text-blue-950">{app.title}</h4>
                <p className="text-xs font-bold text-blue-800">🏥 {app.doctorOrClinic} ({app.specialtyOrExam})</p>
                {app.addressOrLocation && <p className="text-[11px] text-blue-700">📍 {app.addressOrLocation}</p>}
              </div>
            ))}

            {/* Exames Side Card */}
            {selectedDayDetails.exames.map((app) => (
              <div key={app.id} className="bg-purple-50 p-3.5 rounded-2xl border-2 border-purple-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-purple-600 text-white px-2 py-0.5 rounded-md">
                    🔬 EXAME LABORATÓRIO / IMAGEM
                  </span>
                  <span className="text-xs font-black text-purple-900">
                    {new Date(app.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-sm font-black text-purple-950">{app.title}</h4>
                <p className="text-xs font-bold text-purple-800">🏥 {app.doctorOrClinic}</p>
                {app.prepInstructions && (
                  <div className="bg-amber-100 p-2 rounded-xl text-[11px] text-amber-900 font-extrabold border border-amber-300 mt-1">
                    ⚠️ <strong>Preparo:</strong> {app.prepInstructions}
                  </div>
                )}
              </div>
            ))}

            {/* Medicamentos Side Cards */}
            {selectedDaySchedules.length === 0 && selectedDayDetails.dayApps.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-sm space-y-2">
                <Info className="w-8 h-8 mx-auto text-gray-300" />
                <p>Nenhum compromisso ou medicamento agendado para este dia.</p>
              </div>
            ) : (
              selectedDaySchedules.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border-2 space-y-1.5 ${
                    item.status === 'administered'
                      ? 'bg-[#E9F7F2] border-[#63C6A7]'
                      : item.status === 'missed'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-emerald-50/60 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-1">
                      💊 {item.medicationName}
                    </span>
                    <span className="px-2 py-0.5 bg-[#2F7E6A] text-white text-xs font-black rounded-lg">
                      {item.scheduledTime}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2F7E6A]">Dosagem: {item.dosage}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {item.isContinuous ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded-md">
                        🔄 Uso contínuo
                      </span>
                    ) : item.treatmentDurationDays ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px] rounded-md">
                        ⏳ Duração: {item.treatmentDurationDays} dias
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleScheduleSoundAlarm(item.id, item.medicationId);
                      }}
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                        item.soundAlarmEnabled !== false
                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                      title="Clique para alternar o alarme sonoro deste horário"
                    >
                      {item.soundAlarmEnabled !== false ? '🔔 Alarme Ativo' : '🔕 Mudo'}
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-700">
                    Status: {item.status === 'administered' ? '✅ Administrado' : item.status === 'missed' ? '❌ Esquecido' : '⏰ Pendente'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CAIXA DE DIÁLOGO MODAL COMPLETA DO DIA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl border-3 border-[#63C6A7] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#E9F7F2] p-5 border-b-2 border-[#63C6A7] flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-[#2F7E6A] uppercase tracking-wider block">
                  Caixa de Diálogo do Dia • Agendamentos e Saúde
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1F2E2C] capitalize flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-[#2F7E6A]" /> {selectedDateFormatted}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsAddingAppointment(false);
                  setAdministeringItemId(null);
                  setMissingItemId(null);
                }}
                className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Daily Stats & Quick Add Button */}
              <div className="bg-[#E9F7F2]/60 p-4 rounded-2xl border border-[#BFE8D6] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">Resumo do Dia:</span>
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-black rounded-full">
                      🩺 {selectedDayDetails.consultas.length} Consultas
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs font-black rounded-full">
                      🔬 {selectedDayDetails.exames.length} Exames
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#2F7E6A] text-white text-xs font-black rounded-full">
                      💊 {selectedDaySchedules.length} Doses Med.
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAddingAppointment(!isAddingAppointment)}
                    className="py-2 px-3.5 bg-[#2F7E6A] hover:bg-[#256656] text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    {isAddingAppointment ? 'Cancelar Inclusão' : 'Incluir Nova Consulta / Exame'}
                  </button>
                </div>

                {/* Curator Notification Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#BFE8D6]">
                  <button
                    onClick={handleSendDailyReportToCurator}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Relatório Completo ao Curador (WhatsApp)
                  </button>
                </div>
              </div>

              {/* INLINE FORM: Add New Appointment or Exam inside Calendar */}
              {isAddingAppointment && (
                <div className="bg-[#E9F7F2] p-5 rounded-3xl border-3 border-[#63C6A7] shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-base font-black text-[#1F2E2C] flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#2F7E6A]" /> Agendar Consulta ou Exame para {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </h3>

                  <form onSubmit={handleSaveNewAppointmentInCalendar} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Tipo de Procedimento *</label>
                        <select
                          value={newAppType}
                          onChange={(e) => setNewAppType(e.target.value as any)}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        >
                          <option value="exame">🔬 Exame Laboratorial / Imagem</option>
                          <option value="consulta">🩺 Consulta Médica</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Título / Nome *</label>
                        <input
                          type="text"
                          required
                          value={newAppTitle}
                          onChange={(e) => setNewAppTitle(e.target.value)}
                          placeholder="Ex: Hemograma ou Consulta Cardiologia"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Médico / Laboratório *</label>
                        <input
                          type="text"
                          required
                          value={newAppDoctor}
                          onChange={(e) => setNewAppDoctor(e.target.value)}
                          placeholder="Ex: Dra. Ana Costa ou Lab Fleury"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Especialidade / Categoria</label>
                        <input
                          type="text"
                          value={newAppSpecialty}
                          onChange={(e) => setNewAppSpecialty(e.target.value)}
                          placeholder="Ex: Geriatria, Ultrassom, Sangue"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Horário Marcado *</label>
                        <input
                          type="time"
                          required
                          value={newAppTime}
                          onChange={(e) => setNewAppTime(e.target.value)}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Endereço / Local Marcado</label>
                        <input
                          type="text"
                          value={newAppAddress}
                          onChange={(e) => setNewAppAddress(e.target.value)}
                          placeholder="Ex: Av. Paulista, 1000 - Sala 302"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Instruções de Preparo (Jejum, Medicações prévias, Água)</label>
                      <textarea
                        value={newAppPrep}
                        onChange={(e) => setNewAppPrep(e.target.value)}
                        placeholder="Ex: Jejum obrigatório de 12h. Beber 1 litro de água antes..."
                        className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingAppointment(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#2F7E6A] hover:bg-[#256656] text-white font-extrabold rounded-xl text-xs shadow"
                      >
                        Salvar e Sincronizar no Calendário
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SEÇÃO 1: CONSULTAS MÉDICAS AGENDADAS (COR AZUL) */}
              {selectedDayDetails.consultas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" /> 🩺 Consultas Médicas Agendadas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDayDetails.consultas.map((app) => (
                      <div key={app.id} className="bg-blue-50/90 rounded-2xl p-4 border-2 border-blue-300 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-blue-600 text-white font-black text-[10px] rounded-md uppercase mb-1">
                              Consulta Médica
                            </span>
                            <h4 className="text-base font-black text-blue-950">{app.title}</h4>
                            <p className="text-xs font-bold text-blue-800">👨‍⚕️ {app.doctorOrClinic} ({app.specialtyOrExam})</p>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs shrink-0">
                            ⏰ {new Date(app.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {app.addressOrLocation && (
                          <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Endereço: {app.addressOrLocation}
                          </p>
                        )}

                        {app.prepInstructions && (
                          <div className="bg-amber-100 p-2.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-semibold">
                            ⚠️ <strong>Recomendações:</strong> {app.prepInstructions}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
                          <button
                            onClick={() => handleSpeakAppointment(app)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Ouvir
                          </button>
                          <button
                            onClick={() => handleWhatsAppAppointmentShare(app)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEÇÃO 2: EXAMES A REALIZAR (COR ROXA) */}
              {selectedDayDetails.exames.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" /> 🔬 Exames Laboratoriais e de Imagem
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDayDetails.exames.map((app) => (
                      <div key={app.id} className="bg-purple-50/90 rounded-2xl p-4 border-2 border-purple-300 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-purple-600 text-white font-black text-[10px] rounded-md uppercase mb-1">
                              Exame Laboratorial
                            </span>
                            <h4 className="text-base font-black text-purple-950">{app.title}</h4>
                            <p className="text-xs font-bold text-purple-800">🏥 {app.doctorOrClinic} ({app.specialtyOrExam})</p>
                          </div>
                          <span className="px-2.5 py-1 bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs shrink-0">
                            ⏰ {new Date(app.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {app.addressOrLocation && (
                          <p className="text-xs font-semibold text-purple-900 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Endereço: {app.addressOrLocation}
                          </p>
                        )}

                        {/* HIGHLIGHTED EXAM PREPARATION BOX */}
                        {app.prepInstructions && (
                          <div className="bg-amber-300 text-amber-950 p-3 rounded-xl border-2 border-amber-400 text-xs font-extrabold shadow-xs">
                            ⚠️ <strong>Instruções Obrigatórias de Preparo para Exame:</strong>
                            <p className="mt-0.5 font-bold text-amber-900">{app.prepInstructions}</p>
                          </div>
                        )}

                        {app.attachmentUrl && (
                          <a
                            href={app.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-purple-200"
                          >
                            <Paperclip className="w-3.5 h-3.5" /> {app.attachmentName || 'Ver Comprovante / Anexo PDF'}
                          </a>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-200">
                          <button
                            onClick={() => handleSpeakAppointment(app)}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Ouvir
                          </button>
                          <button
                            onClick={() => handleWhatsAppAppointmentShare(app)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEÇÃO 3: MEDICAMENTOS PROGRAMADOS (COR VERDE) */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-[#1F2E2C] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2F7E6A]" /> 💊 Medicamentos Programados e Horários de Aplicação
                </h3>

                {selectedDaySchedules.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 font-medium text-sm space-y-2 bg-gray-50 rounded-2xl border border-gray-200">
                    <Info className="w-8 h-8 mx-auto text-gray-300" />
                    <p>Nenhuma medicação programada para este dia.</p>
                  </div>
                ) : (
                  selectedDaySchedules.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 space-y-3 transition ${
                        item.status === 'administered'
                          ? 'bg-[#E9F7F2] border-[#63C6A7]'
                          : item.status === 'missed'
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-amber-50/60 border-amber-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150'}
                            alt={item.medicationName}
                            className="w-12 h-12 rounded-xl object-cover border border-[#63C6A7] shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#1F2E2C] text-base">
                                {item.medicationName}
                              </span>
                              <span className="px-2 py-0.5 bg-white border border-[#63C6A7] text-[#2F7E6A] text-xs font-bold rounded-full">
                                {item.pharmaceuticalForm}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-[#2F7E6A]">Dosagem: {item.dosage}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {item.isContinuous ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold rounded-md flex items-center gap-1">
                                  🔄 Medicamento de uso contínuo
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold rounded-md flex items-center gap-1">
                                  ⏳ Duração do Tratamento: {item.treatmentDurationDays || 30} dias
                                </span>
                              )}
                              {/* Editable Sound Alarm Toggle in Agenda */}
                              <button
                                type="button"
                                onClick={() => toggleScheduleSoundAlarm(item.id, item.medicationId)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs ${
                                  item.soundAlarmEnabled !== false
                                    ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                                title="Opção de alarme sonoro editável: clique para ativar ou silenciar este horário"
                              >
                                {item.soundAlarmEnabled !== false ? (
                                  <>🔔 Alarme Sonoro Ativo</>
                                ) : (
                                  <>🔕 Alarme Sonoro Mudo</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-[#2F7E6A] text-white text-sm font-black rounded-xl shadow-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {item.scheduledTime}
                          </span>

                          <button
                            onClick={() => handleWhatsAppShare(item)}
                            className="p-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-xl transition font-bold text-xs flex items-center gap-1"
                            title="Lembrete via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Status Info & Administered By Details */}
                      <div className="pt-2 border-t border-black/5 text-xs text-[#1F2E2C] space-y-1 font-semibold">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span>Status:</span>
                            {item.status === 'administered' && (
                              <span className="px-2.5 py-0.5 bg-[#2F7E6A] text-white font-black rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Administrado com Sucesso
                              </span>
                            )}
                            {item.status === 'missed' && (
                              <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black rounded-md flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> NÃO Administrado / Esquecido
                              </span>
                            )}
                            {(item.status === 'pending' || item.status === 'delayed') && (
                              <span className="px-2.5 py-0.5 bg-amber-500 text-white font-black rounded-md flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Pendente / Aguardando Aplicação
                              </span>
                            )}
                          </div>

                          {item.administeredBy && (
                            <div className="text-xs font-extrabold text-[#2F7E6A] bg-white px-2.5 py-1 rounded-lg border border-[#63C6A7] flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" /> Responsável: {item.administeredBy} ({item.responsibleRole || 'Cuidador'})
                            </div>
                          )}
                        </div>

                        {item.administeredAt && (
                          <p className="text-[11px] text-gray-600">
                            🕒 Horário da Aplicação Real: <strong>{item.administeredAt}</strong>
                          </p>
                        )}

                        {item.reasonNotAdministered && (
                          <p className="text-xs text-rose-800 font-bold bg-white p-2.5 rounded-xl border border-rose-300">
                            ⚠️ Motivo Informado: {item.reasonNotAdministered}
                          </p>
                        )}
                      </div>

                      {/* Action buttons if pending */}
                      {item.status !== 'administered' && administeringItemId !== item.id && missingItemId !== item.id && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5">
                          <button
                            onClick={() => startAdministering(item)}
                            className="flex-1 py-2 px-3 bg-[#2F7E6A] hover:bg-[#256656] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Confirmar Administração
                          </button>
                          <button
                            onClick={() => startMarkingMissed(item)}
                            className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Marcar Falta
                          </button>
                        </div>
                      )}

                      {/* Inline Administration Form */}
                      {administeringItemId === item.id && (
                        <div className="mt-3 p-4 bg-white rounded-2xl border-2 border-[#63C6A7] shadow-sm space-y-3 animate-in fade-in duration-150">
                          <h4 className="text-xs font-black text-[#1F2E2C] uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-[#2F7E6A]" /> Registrar Quem Administrou o Medicamento
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">
                                Responsável / Papel *
                              </label>
                              <select
                                value={adminRole}
                                onChange={(e) => setAdminRole(e.target.value as CaregiverRelation | 'Paciente')}
                                className="w-full p-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs font-bold text-[#1F2E2C]"
                              >
                                <option value="Cuidador">🩺 Cuidador(a)</option>
                                <option value="Enfermeiro">💉 Enfermeiro(a)</option>
                                <option value="Paciente">🧑‍🦯 Próprio Paciente</option>
                                <option value="Curador">👨‍👩‍👦 Curador / Familiar Responsável</option>
                                <option value="Filho">👨‍👦 Filho</option>
                                <option value="Filha">👩‍👧 Filha</option>
                                <option value="Esposa">👰 Esposa</option>
                                <option value="Marido">🤵 Marido</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">
                                Nome da Pessoa *
                              </label>
                              <input
                                type="text"
                                required
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Nome da pessoa que ministrou"
                                className="w-full p-2 bg-white border border-[#63C6A7] rounded-xl text-xs font-semibold text-[#1F2E2C]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">
                                Horário da Aplicação
                              </label>
                              <input
                                type="time"
                                value={adminTime}
                                onChange={(e) => setAdminTime(e.target.value)}
                                className="w-full p-2 bg-white border border-[#63C6A7] rounded-xl text-xs font-semibold text-[#1F2E2C]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">
                                Observações (Opcional)
                              </label>
                              <input
                                type="text"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Ex: Tomou com suco de laranja"
                                className="w-full p-2 bg-white border border-[#63C6A7] rounded-xl text-xs font-semibold text-[#1F2E2C]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setAdministeringItemId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => submitAdminister(item.id)}
                              className="px-4 py-1.5 bg-[#2F7E6A] hover:bg-[#256656] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Salvar Administração
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Missed Reason Form */}
                      {missingItemId === item.id && (
                        <div className="mt-3 p-4 bg-rose-50 rounded-2xl border-2 border-rose-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                          <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" /> Registrar Motivo do Não Uso
                          </h4>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Motivo da Não Administração *
                            </label>
                            <input
                              type="text"
                              required
                              value={missingReason}
                              onChange={(e) => setMissingReason(e.target.value)}
                              placeholder="Ex: Paciente recusou, em jejum pré-exame, falta no estoque"
                              className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs font-semibold text-[#1F2E2C]"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setMissingItemId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => submitMarkingMissed(item)}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Registrar Falta & Notificar Curador
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">
                Sistema Cuidado Sênior • Gestão e Registro da Saúde
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-[#2F7E6A] hover:bg-[#256656] text-white text-xs font-black rounded-xl shadow-xs transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


