import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleItem } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  FileText,
  Info,
} from 'lucide-react';

export const SmartCalendar: React.FC = () => {
  const { schedules } = useApp();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );

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

  const getDayStatus = (dateStr: string) => {
    const dayMeds = schedules.filter((s) => s.scheduledDate === dateStr);
    if (dayMeds.length === 0) {
      return { status: 'none', label: 'Sem medicação', colorClass: 'bg-white border-gray-200 text-gray-400', badgeClass: 'bg-gray-200 text-gray-600' };
    }

    const hasMissed = dayMeds.some((m) => m.status === 'missed');
    const hasAllTaken = dayMeds.every((m) => m.status === 'administered');
    const hasDelayedOrPending = dayMeds.some(
      (m) => m.status === 'pending' || m.status === 'delayed'
    );

    if (hasMissed) {
      return { status: 'missed', label: 'Medicamento Esquecido', colorClass: 'bg-rose-50 border-rose-300 text-rose-800 font-bold', badgeClass: 'bg-rose-500 text-white' };
    }
    if (hasAllTaken) {
      return { status: 'all_taken', label: 'Todos Administrados', colorClass: 'bg-[#E9F7F2] border-[#63C6A7] text-[#1F2E2C] font-black', badgeClass: 'bg-[#2F7E6A] text-white' };
    }
    if (hasDelayedOrPending) {
      return { status: 'pending', label: 'Medicamento Pendente/Atrasado', colorClass: 'bg-amber-50 border-amber-300 text-amber-800 font-bold', badgeClass: 'bg-amber-500 text-white' };
    }

    return { status: 'none', label: 'Sem medicação', colorClass: 'bg-white border-gray-200 text-gray-400', badgeClass: 'bg-gray-200 text-gray-600' };
  };

  const selectedDaySchedules = schedules.filter((s) => s.scheduledDate === selectedDateStr);
  const selectedDateFormatted = new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-[#2F7E6A]" /> Calendário Inteligente de Medicação
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Visualização estilo Google Calendar com status visual por dia (Verde, Amarelo, Vermelho, Branco)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-[#BFE8D6] text-xs font-bold text-[#1F2E2C]">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2F7E6A] inline-block shadow-sm"></span> 🟢 Verde: Todos Tomados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-sm"></span> 🟡 Amarelo: Atrasado / Pendente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-sm"></span> 🔴 Vermelho: Esquecido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-gray-200 border border-gray-400 inline-block"></span> ⚪ Branco: Sem Medicação
          </span>
        </div>
      </div>

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
              <div key={`empty_${idx}`} className="h-20 sm:h-24 rounded-2xl bg-gray-50/50 border border-gray-100"></div>
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDayString(dayNum);
              const info = getDayStatus(dateStr);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dayMedsCount = schedules.filter((s) => s.scheduledDate === dateStr).length;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${info.colorClass} ${
                    isSelected ? 'ring-3 ring-[#2F7E6A] ring-offset-2 scale-[1.03] z-10 shadow-md' : 'hover:scale-[1.02]'
                  } ${isToday ? 'border-l-4 border-l-[#2F7E6A]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black ${isToday ? 'px-1.5 py-0.5 bg-[#2F7E6A] text-white rounded-md' : ''}`}>
                      {dayNum}
                    </span>
                    {info.status !== 'none' && (
                      <span className={`w-3 h-3 rounded-full ${info.badgeClass} shadow-sm`}></span>
                    )}
                  </div>

                  <div className="text-[10px] font-bold truncate">
                    {dayMedsCount > 0 ? (
                      <span className="block px-1.5 py-0.5 rounded-md bg-white/70 backdrop-blur-xs text-[#1F2E2C]">
                        {dayMedsCount} med.
                      </span>
                    ) : (
                      <span className="text-gray-300 font-normal">Livre</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Inspector Panel */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4 flex flex-col">
          <div className="pb-3 border-b border-[#BFE8D6]">
            <span className="text-[11px] font-bold text-[#2F7E6A] uppercase tracking-wider block">
              Detalhamento do Dia
            </span>
            <h3 className="text-lg font-black text-[#1F2E2C] capitalize">
              {selectedDateFormatted}
            </h3>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {selectedDaySchedules.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-sm space-y-2">
                <Info className="w-8 h-8 mx-auto text-gray-300" />
                <p>Nenhuma medicação agendada para este dia.</p>
              </div>
            ) : (
              selectedDaySchedules.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 space-y-2 ${
                    item.status === 'administered'
                      ? 'bg-[#E9F7F2] border-[#63C6A7]'
                      : item.status === 'missed'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-[#BFE8D6]/20 border-[#BFE8D6]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1F2E2C] text-base">
                      {item.medicationName}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#2F7E6A] text-white text-xs font-black rounded-lg">
                      {item.scheduledTime}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#2F7E6A]">{item.dosage}</p>

                  <div className="text-xs text-[#1F2E2C] font-semibold space-y-1 pt-1 border-t border-black/5">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2F7E6A]" /> Status:{' '}
                      <strong>
                        {item.status === 'administered'
                          ? '✅ Administrado com Sucesso'
                          : item.status === 'missed'
                          ? '❌ Não Administrado / Esquecido'
                          : '⏰ Pendente'}
                      </strong>
                    </p>

                    {item.administeredBy && (
                      <p className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#2F7E6A]" /> Responsável:{' '}
                        <strong>{item.administeredBy} ({item.responsibleRole || 'Cuidador'})</strong>
                      </p>
                    )}

                    {item.administeredAt && (
                      <p className="text-[11px] text-gray-600">
                        Confirmado em: {item.administeredAt}
                      </p>
                    )}

                    {item.reasonNotAdministered && (
                      <p className="text-xs text-rose-700 font-bold bg-white p-2 rounded-xl border border-rose-200">
                        Motivo: {item.reasonNotAdministered}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
