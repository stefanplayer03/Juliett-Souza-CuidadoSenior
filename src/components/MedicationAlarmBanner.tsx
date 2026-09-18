import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem, MedicalAppointment } from '../types';
import { Bell, AlertTriangle, Volume2, VolumeX, CheckCircle2, MessageCircle, X, Calendar as CalendarIcon, Stethoscope, MapPin } from 'lucide-react';
import { audioService } from '../services/audio';
import { openWhatsAppMedicationReminder, openWhatsAppAppointmentReminder } from '../utils/whatsapp';

export const MedicationAlarmBanner: React.FC = () => {
  const { schedules, medicalAppointments, patient, caregivers, confirmScheduleAdministered } = useApp();
  const [activeAlarmItem, setActiveAlarmItem] = useState<ScheduleItem | null>(null);
  const [activeAppointmentAlert, setActiveAppointmentAlert] = useState<MedicalAppointment | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Poll for due medications and today's appointments/exams every 10 seconds
  useEffect(() => {
    const checkAlarm = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const currentDateStr = now.toISOString().split('T')[0];

      // 1. Check for pending medication due at or before current time on current date
      const dueMedication = schedules.find((s) => {
        if (s.status !== 'pending' && s.status !== 'delayed') return false;
        if (dismissedIds.includes(s.id)) return false;
        if (s.scheduledDate !== currentDateStr) return false;
        return s.scheduledTime <= currentTimeStr;
      });

      if (dueMedication && dueMedication.id !== activeAlarmItem?.id) {
        setActiveAlarmItem(dueMedication);
        const shouldPlaySound = dueMedication.soundAlarmEnabled !== false;
        if (!isMuted && shouldPlaySound) {
          audioService.playAlarmSound();
          const durationPhrase = dueMedication.isContinuous
            ? 'Medicamento de uso contínuo.'
            : dueMedication.treatmentDurationDays
            ? `Duração do tratamento: ${dueMedication.treatmentDurationDays} dias.`
            : '';
          audioService.speakText(
            `Atenção! Hora do medicamento ${dueMedication.medicationName}, dosagem ${dueMedication.dosage}. ${dueMedication.timingInstruction}. ${durationPhrase}`
          );
        }
        return;
      }

      // 2. Check for today's medical appointments or exams that have not been dismissed
      const dueAppointment = medicalAppointments.find((app) => {
        if (app.status === 'concluido' || app.status === 'cancelado') return false;
        if (dismissedIds.includes(app.id)) return false;
        const appDateStr = app.dateTime.split('T')[0];
        return appDateStr === currentDateStr;
      });

      if (dueAppointment && dueAppointment.id !== activeAppointmentAlert?.id && !activeAlarmItem) {
        setActiveAppointmentAlert(dueAppointment);
        if (!isMuted) {
          audioService.playAlarmSound();
          const appTypeLabel = dueAppointment.type === 'exame' ? 'Exame laboratorial' : 'Consulta médica';
          const prepText = dueAppointment.prepInstructions ? `. Atenção para o preparo: ${dueAppointment.prepInstructions}` : '';
          audioService.speakText(
            `Atenção! Lembrete de ${appTypeLabel} hoje: ${dueAppointment.title} na ${dueAppointment.doctorOrClinic}${prepText}`
          );
        }
      }
    };

    checkAlarm();
    const interval = setInterval(checkAlarm, 10000);
    return () => clearInterval(interval);
  }, [schedules, medicalAppointments, activeAlarmItem, activeAppointmentAlert, dismissedIds, isMuted]);

  if (!activeAlarmItem && !activeAppointmentAlert) return null;

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      audioService.playAlarmSound();
    } else {
      setIsMuted(true);
      audioService.stopSpeech();
    }
  };

  const handleDismissMedication = () => {
    if (activeAlarmItem) {
      setDismissedIds((prev) => [...prev, activeAlarmItem.id]);
      setActiveAlarmItem(null);
      audioService.stopSpeech();
    }
  };

  const handleDismissAppointment = () => {
    if (activeAppointmentAlert) {
      setDismissedIds((prev) => [...prev, activeAppointmentAlert.id]);
      setActiveAppointmentAlert(null);
      audioService.stopSpeech();
    }
  };

  const handleConfirmTaken = () => {
    if (activeAlarmItem) {
      confirmScheduleAdministered(activeAlarmItem.id, 'Cuidador de Plantão', 'Cuidador');
      setActiveAlarmItem(null);
      audioService.stopSpeech();
      audioService.playSuccessChime();
    }
  };

  const handleSendMedicationWhatsApp = () => {
    if (!activeAlarmItem) return;
    const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty) || caregivers[0];
    const phone = activeCaregiver?.phone || patient.emergencyPhone || '';

    openWhatsAppMedicationReminder(phone, {
      patientName: patient.fullName,
      medicationName: activeAlarmItem.medicationName,
      dosage: activeAlarmItem.dosage,
      scheduledTime: activeAlarmItem.scheduledTime,
      timingInstruction: activeAlarmItem.timingInstruction,
    });
  };

  const handleSendAppointmentWhatsApp = () => {
    if (!activeAppointmentAlert) return;
    const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty) || caregivers[0];
    const phone = activeCaregiver?.phone || patient.emergencyPhone || '';

    openWhatsAppAppointmentReminder(phone, {
      patientName: patient.fullName,
      appointmentTitle: activeAppointmentAlert.title,
      appointmentType: activeAppointmentAlert.type,
      doctorOrClinic: activeAppointmentAlert.doctorOrClinic,
      dateTime: new Date(activeAppointmentAlert.dateTime).toLocaleString('pt-BR'),
      prepInstructions: activeAppointmentAlert.prepInstructions,
    });
  };

  // Render Appointment/Exam Alarm Banner
  if (activeAppointmentAlert) {
    const isExame = activeAppointmentAlert.type === 'exame';
    const timeFormatted = new Date(activeAppointmentAlert.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className={`fixed top-20 right-4 left-4 sm:left-auto sm:w-[520px] z-50 text-white p-5 rounded-3xl shadow-2xl border-4 animate-bounce space-y-3 ${
        isExame ? 'bg-purple-700 border-purple-400' : 'bg-blue-700 border-blue-400'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl shadow">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded-md tracking-wider">
                🚨 ALERTA DE {isExame ? 'EXAME MÉDICO' : 'CONSULTA MÉDICA'} - HOJE
              </span>
              <h4 className="text-lg font-black leading-tight">{activeAppointmentAlert.title}</h4>
            </div>
          </div>

          <button
            onClick={handleDismissAppointment}
            className="p-1.5 hover:bg-white/20 rounded-full text-white transition"
            title="Fechar alerta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white/10 p-3.5 rounded-2xl text-xs space-y-2 font-semibold border border-white/20">
          <div className="flex items-center justify-between">
            <p className="font-bold text-white text-sm flex items-center gap-1">
              <CalendarIcon className="w-4 h-4 text-amber-300" /> Horário Marcado: {timeFormatted}
            </p>
            <span className="bg-white text-gray-900 text-[11px] font-black px-2 py-0.5 rounded-md">
              Especialidade: {activeAppointmentAlert.specialtyOrExam}
            </span>
          </div>

          <p className="text-white/90 flex items-center gap-1">
            🏥 <strong>Local/Médico:</strong> {activeAppointmentAlert.doctorOrClinic}
          </p>

          {activeAppointmentAlert.addressOrLocation && (
            <p className="text-white/80 flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Endereço: {activeAppointmentAlert.addressOrLocation}
            </p>
          )}

          {activeAppointmentAlert.prepInstructions && (
            <div className="bg-amber-400 text-gray-900 p-2.5 rounded-xl text-xs font-extrabold border border-amber-300">
              ⚠️ <strong>Preparo Necessário para o Exame/Consulta:</strong>
              <p className="mt-0.5 font-bold text-gray-800">{activeAppointmentAlert.prepInstructions}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            onClick={handleMuteToggle}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 font-bold text-xs rounded-xl flex items-center gap-1.5 text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'Desmutar' : 'Mutar Áudio'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendAppointmentWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow"
              title="Avisar no WhatsApp do Cuidador"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>

            <button
              onClick={handleDismissAppointment}
              className="px-4 py-2 bg-white text-gray-900 font-black text-xs rounded-xl flex items-center gap-1.5 hover:bg-gray-100 shadow transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ciente / Ocultar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Medication Alarm Banner
  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-[480px] z-50 bg-amber-500 text-white p-5 rounded-3xl shadow-2xl border-4 border-amber-300 animate-bounce space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-amber-400">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-amber-600 rounded-xl shadow">
            <Bell className="w-6 h-6 animate-spin" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase bg-amber-700 px-2 py-0.5 rounded-md tracking-wider">
              DESPERTADOR DE MEDICAMENTO DUE
            </span>
            <h4 className="text-lg font-black leading-tight">{activeAlarmItem?.medicationName}</h4>
          </div>
        </div>

        <button
          onClick={handleDismissMedication}
          className="p-1.5 hover:bg-amber-600 rounded-full text-white transition"
          title="Fechar alerta"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-amber-600/60 p-3 rounded-2xl text-xs space-y-1.5 font-semibold border border-amber-400">
        <div className="flex items-center justify-between">
          <p className="font-bold text-white text-sm">
            Dosagem: {activeAlarmItem?.dosage} ({activeAlarmItem?.scheduledTime})
          </p>
          {activeAlarmItem?.isContinuous ? (
            <span className="px-2 py-0.5 bg-emerald-700/80 text-white text-[10px] font-black rounded-md border border-emerald-400">
              🔄 Uso contínuo
            </span>
          ) : activeAlarmItem?.treatmentDurationDays ? (
            <span className="px-2 py-0.5 bg-blue-700/80 text-white text-[10px] font-black rounded-md border border-blue-400">
              ⏳ {activeAlarmItem.treatmentDurationDays} dias
            </span>
          ) : null}
        </div>
        <p className="text-amber-100">📌 Instrução: {activeAlarmItem?.timingInstruction}</p>
        {patient && <p className="text-amber-200">Paciente: {patient.fullName}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          onClick={handleMuteToggle}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 font-bold text-xs rounded-xl flex items-center gap-1.5 text-white transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isMuted ? 'Desmutar Áudio' : 'Mutar Áudio'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendMedicationWhatsApp}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow"
            title="Avisar no WhatsApp do Cuidador"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>

          <button
            onClick={handleConfirmTaken}
            className="px-4 py-2 bg-white text-amber-900 font-black text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-100 shadow transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmar Tomado
          </button>
        </div>
      </div>
    </div>
  );
};

