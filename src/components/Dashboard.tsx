import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem } from '../types';
import { MedicationConfirmModal } from './MedicationConfirmModal';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pill,
  UserCheck,
  Calendar,
  Volume2,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { audioService } from '../services/audio';

export const Dashboard: React.FC = () => {
  const {
    schedules,
    patient,
    activeCaregiverOnDuty,
    caregivers,
    confirmScheduleAdministered,
    pendingConfirmationSchedule,
    setPendingConfirmationSchedule,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'administered' | 'missed'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules
    .filter((s) => s.scheduledDate === todayStr)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const administeredCount = todaySchedules.filter((s) => s.status === 'administered').length;
  const missedCount = todaySchedules.filter((s) => s.status === 'missed').length;
  const pendingCount = todaySchedules.filter((s) => s.status === 'pending').length;
  const totalToday = todaySchedules.length;

  const currentHourMin = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Find next upcoming pending schedule
  const nextPending = todaySchedules.find((s) => s.status === 'pending');

  // Find last administered schedule
  const lastAdministered = [...schedules]
    .filter((s) => s.status === 'administered')
    .sort((a, b) => (b.administeredAt || '').localeCompare(a.administeredAt || ''))[0];

  // Check for overdue alert (> 15 minutes past schedule and still pending)
  const overdueSchedules = todaySchedules.filter((s) => {
    if (s.status !== 'pending') return false;
    return s.scheduledTime < currentHourMin;
  });

  const filteredList = todaySchedules.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  // Calculate 7-day mini calendar status indicators
  const getMiniCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayNum = d.getDate();

      const dayMeds = schedules.filter((s) => s.scheduledDate === dateStr);
      let colorClass = 'bg-gray-100 text-gray-500 border-gray-300';
      let dotColor = 'bg-[#1F2E2C]/20';

      if (dayMeds.length > 0) {
        const hasMissed = dayMeds.some((m) => m.status === 'missed');
        const hasAllTaken = dayMeds.every((m) => m.status === 'administered');
        const hasPending = dayMeds.some((m) => m.status === 'pending');

        if (hasMissed) {
          colorClass = 'bg-rose-50 text-rose-700 border-rose-300';
          dotColor = 'bg-rose-500';
        } else if (hasAllTaken) {
          colorClass = 'bg-[#E9F7F2] text-[#2F7E6A] border-[#63C6A7] font-bold';
          dotColor = 'bg-[#2F7E6A]';
        } else if (hasPending) {
          colorClass = 'bg-amber-50 text-amber-700 border-amber-300';
          dotColor = 'bg-amber-500';
        }
      }

      days.push({
        dateStr,
        dayName,
        dayNum,
        isToday: i === 0,
        colorClass,
        dotColor,
      });
    }
    return days;
  };

  const miniDays = getMiniCalendarDays();

  return (
    <div className="space-y-6">
      {/* Pending Overdue Escalation Alert Banner */}
      {overdueSchedules.length > 0 && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg border-2 border-rose-400 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 stroke-[2.5] flex-shrink-0" />
            <div>
              <h3 className="font-extrabold text-base">Alerta de Lembrete Atrasado!</h3>
              <p className="text-xs text-rose-100 font-medium">
                Há {overdueSchedules.length} medicamento(s) com horário pendente de confirmação. Notificação enviada aos cuidadores responsáveis!
              </p>
            </div>
          </div>
          <button
            onClick={() => setPendingConfirmationSchedule(overdueSchedules[0])}
            className="px-4 py-2 bg-white text-rose-700 font-black rounded-xl text-xs hover:bg-rose-50 shadow transition whitespace-nowrap"
          >
            Confirmar Agora
          </button>
        </div>
      )}

      {/* Hero Grid: Next Medication & Summary Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Card: Próximo Medicamento */}
        <div className="lg:col-span-2 bg-[#E9F7F2] rounded-3xl p-6 border-3 border-[#63C6A7] shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFE8D6]/40 rounded-full blur-2xl -z-0"></div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6]">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#2F7E6A] text-white text-xs font-bold rounded-full shadow-sm">
                <Clock className="w-4 h-4" /> Próxima Medicação
              </span>
              <span className="text-xs font-extrabold text-[#2F7E6A]">
                Horário Atual: {currentHourMin}
              </span>
            </div>

            {nextPending ? (
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
                <img
                  src={nextPending.photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'}
                  alt={nextPending.medicationName}
                  className="w-28 h-28 rounded-2xl object-cover border-3 border-[#63C6A7] shadow-md"
                />

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1F2E2C]">
                      {nextPending.medicationName}
                    </h2>
                    <button
                      onClick={() =>
                        audioService.speakText(
                          `Próximo medicamento: ${nextPending.medicationName}, dosagem ${nextPending.dosage} às ${nextPending.scheduledTime}`
                        )
                      }
                      className="p-1.5 text-[#2F7E6A] hover:bg-[#BFE8D6] rounded-lg transition"
                      title="Ouvir em voz alta"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-lg font-bold text-[#2F7E6A]">{nextPending.dosage}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-3 py-1 bg-[#2F7E6A] text-white rounded-lg text-xs font-black shadow-sm">
                      🕒 Horário: {nextPending.scheduledTime}
                    </span>
                    <span className="px-2.5 py-1 bg-white text-[#1F2E2C] border border-[#63C6A7] text-xs font-bold rounded-lg">
                      {nextPending.pharmaceuticalForm}
                    </span>
                    <span className="px-2.5 py-1 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-bold rounded-lg">
                      {nextPending.timingInstruction}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#2F7E6A] mx-auto" />
                <h3 className="text-xl font-bold text-[#1F2E2C]">Tudo concluído por hoje!</h3>
                <p className="text-xs text-[#2F7E6A]">Todas as medicações programadas para hoje foram administradas.</p>
              </div>
            )}
          </div>

          {nextPending && (
            <div className="mt-6 pt-4 border-t border-[#BFE8D6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#1F2E2C] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#2F7E6A]" /> Paciente: <strong>{patient.fullName}</strong>
              </span>

              <button
                onClick={() => setPendingConfirmationSchedule(nextPending)}
                className="w-full sm:w-auto px-6 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirmar Administração
              </button>
            </div>
          )}
        </div>

        {/* Side Panel: Daily Metrics & Last Administration */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Daily Progress Widget */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#BFE8D6] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#2F7E6A]" /> Progresso do Dia
              </h3>
              <span className="text-xs font-black text-[#2F7E6A] px-2 py-0.5 bg-[#E9F7F2] rounded-full">
                {administeredCount} / {totalToday} Tomados
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-[#BFE8D6]">
              <div
                className="h-full bg-[#63C6A7] rounded-full transition-all duration-500"
                style={{ width: `${totalToday > 0 ? (administeredCount / totalToday) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-[#E9F7F2] p-2 rounded-xl border border-[#63C6A7]">
                <span className="block font-black text-base text-[#2F7E6A]">{administeredCount}</span>
                <span className="text-[10px] font-bold text-[#1F2E2C]">Tomados</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                <span className="block font-black text-base text-amber-700">{pendingCount}</span>
                <span className="text-[10px] font-bold text-amber-800">Pendentes</span>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
                <span className="block font-black text-base text-rose-700">{missedCount}</span>
                <span className="text-[10px] font-bold text-rose-800">Esquecidos</span>
              </div>
            </div>
          </div>

          {/* Last Taken Info Card */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#BFE8D6] shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-[#2F7E6A] uppercase tracking-wider block">
              Último Medicamento Tomado
            </span>
            {lastAdministered ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E9F7F2] border border-[#63C6A7] flex items-center justify-center text-[#2F7E6A] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1F2E2C] text-sm">{lastAdministered.medicationName}</h4>
                  <p className="text-xs font-semibold text-gray-600">{lastAdministered.dosage}</p>
                  <p className="text-[11px] text-[#2F7E6A] font-bold mt-1">
                    Administrado por {lastAdministered.administeredBy} ({lastAdministered.responsibleRole || 'Responsável'}) às {lastAdministered.administeredAt?.split(' ')[1] || lastAdministered.scheduledTime}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Nenhum medicamento tomado recentemente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Mini Calendar Strip with Status Indicators */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#BFE8D6] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-[#1F2E2C] text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2F7E6A]" /> Calendário Semanal da Medicação
          </h3>
          <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#2F7E6A]"></span> Concluído</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendente</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Esquecido</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-1">
          {miniDays.map((d, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border text-center transition ${d.colorClass} ${
                d.isToday ? 'ring-2 ring-[#2F7E6A] ring-offset-2 scale-105 shadow' : ''
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{d.dayName}</span>
              <span className="block text-lg font-black my-0.5">{d.dayNum}</span>
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${d.dotColor} mt-1`}></span>
            </div>
          ))}
        </div>
      </div>

      {/* Medicamentos do Dia Section */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BFE8D6]">
          <div>
            <h3 className="text-xl font-extrabold text-[#1F2E2C]">Medicamentos do Dia</h3>
            <p className="text-xs text-gray-600 font-medium">
              Acompanhamento de todas as doses programadas para hoje
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-[#E9F7F2] p-1 rounded-2xl border border-[#63C6A7]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'all'
                  ? 'bg-[#2F7E6A] text-white shadow'
                  : 'text-[#1F2E2C] hover:bg-white/50'
              }`}
            >
              Todos ({totalToday})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-[#1F2E2C] hover:bg-white/50'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('administered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'administered'
                  ? 'bg-[#2F7E6A] text-white shadow'
                  : 'text-[#1F2E2C] hover:bg-white/50'
              }`}
            >
              Tomados ({administeredCount})
            </button>
            <button
              onClick={() => setFilterStatus('missed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'missed'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-[#1F2E2C] hover:bg-white/50'
              }`}
            >
              Esquecidos ({missedCount})
            </button>
          </div>
        </div>

        {/* Medication Cards List */}
        <div className="space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-medium text-sm">
              Nenhum medicamento encontrado nesta categoria.
            </div>
          ) : (
            filteredList.map((item) => {
              const isTaken = item.status === 'administered';
              const isMissed = item.status === 'missed';
              const isPending = item.status === 'pending';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 transition flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    isTaken
                      ? 'bg-[#E9F7F2]/60 border-[#63C6A7]'
                      : isMissed
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-white border-[#BFE8D6] hover:border-[#63C6A7]'
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150'}
                      alt={item.medicationName}
                      className="w-16 h-16 rounded-xl object-cover border border-[#63C6A7] shadow-sm shrink-0"
                    />

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#1F2E2C]">
                          {item.medicationName}
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 bg-[#2F7E6A] text-white rounded-md">
                          {item.scheduledTime}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#2F7E6A]">{item.dosage}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-semibold text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
                          {item.pharmaceuticalForm}
                        </span>
                        <span className="px-2 py-0.5 bg-[#BFE8D6]/60 rounded-md">
                          {item.timingInstruction}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Badge */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {isTaken && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#2F7E6A] text-white text-xs font-extrabold rounded-full">
                          <CheckCircle2 className="w-4 h-4" /> Tomado
                        </span>
                        <p className="text-[11px] text-gray-600 font-semibold mt-1">
                          {item.administeredBy} às {item.administeredAt?.split(' ')[1] || item.scheduledTime}
                        </p>
                      </div>
                    )}

                    {isMissed && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-xs font-extrabold rounded-full">
                          <XCircle className="w-4 h-4" /> Esquecido / Não Tomado
                        </span>
                        <p className="text-[11px] text-rose-700 font-semibold mt-1">
                          Motivo: {item.reasonNotAdministered || 'Não especificado'}
                        </p>
                      </div>
                    )}

                    {isPending && (
                      <button
                        onClick={() => setPendingConfirmationSchedule(item)}
                        className="px-5 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirmar Dose
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Confirmation Modal */}
      {pendingConfirmationSchedule && (
        <MedicationConfirmModal
          schedule={pendingConfirmationSchedule}
          onClose={() => setPendingConfirmationSchedule(null)}
        />
      )}
    </div>
  );
};
