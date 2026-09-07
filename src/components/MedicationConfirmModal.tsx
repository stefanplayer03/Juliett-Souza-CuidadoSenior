import React, { useState } from 'react';
import { ScheduleItem, CaregiverRelation } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  Pill,
  AlertTriangle,
  UserCheck,
  Info,
} from 'lucide-react';
import { audioService } from '../services/audio';

interface MedicationConfirmModalProps {
  schedule: ScheduleItem;
  onClose: () => void;
}

export const MedicationConfirmModal: React.FC<MedicationConfirmModalProps> = ({
  schedule,
  onClose,
}) => {
  const { confirmScheduleAdministered, markScheduleNotAdministered, caregivers } = useApp();
  const { currentUser } = useAuth();

  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('Recusou o medicamento');
  const [customReason, setCustomReason] = useState('');
  const [responsibleRole, setResponsibleRole] = useState<CaregiverRelation | 'Paciente'>('Cuidador');
  const [notes, setNotes] = useState('');

  const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty);
  const userName = currentUser?.displayName || activeCaregiver?.name || 'Cuidador Responsável';

  const handleConfirmAdministered = () => {
    confirmScheduleAdministered(schedule.id, userName, responsibleRole, notes);
    onClose();
  };

  const handleConfirmNotAdministered = () => {
    const finalReason = reason === 'Outro' ? customReason || 'Motivo não especificado' : reason;
    markScheduleNotAdministered(schedule.id, finalReason, userName);
    onClose();
  };

  const handleSpeakInstruction = () => {
    const text = `Atenção: Hora de tomar ${schedule.medicationName}, dosagem ${schedule.dosage}. Forma: ${schedule.pharmaceuticalForm}. Orientação: ${schedule.timingInstruction}.`;
    audioService.speakText(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#E9F7F2] rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-[#63C6A7] animate-in fade-in zoom-in-95 duration-200"
        style={{ color: '#1F2E2C' }}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BFE8D6]">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#2F7E6A] text-white rounded-xl shadow-sm">
              <Pill className="w-6 h-6 stroke-[2.5]" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2E2C]">Confirmação de Dose</h2>
              <p className="text-xs text-[#2F7E6A] font-semibold">
                Horário Programado: {schedule.scheduledTime}
              </p>
            </div>
          </div>
          <button
            onClick={handleSpeakInstruction}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] rounded-xl font-bold text-xs shadow transition"
            title="Ouvir lembrete em voz alta"
          >
            <Volume2 className="w-4 h-4" /> Ouvir
          </button>
        </div>

        {/* Medication Card Details */}
        <div className="my-5 bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <img
            src={schedule.photo || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'}
            alt={schedule.medicationName}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#63C6A7] shadow"
          />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-black text-[#1F2E2C]">{schedule.medicationName}</h3>
            <p className="text-base font-bold text-[#2F7E6A] mt-0.5">{schedule.dosage}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7] text-xs font-bold rounded-full">
                {schedule.pharmaceuticalForm}
              </span>
              <span className="px-2.5 py-0.5 bg-[#BFE8D6] text-[#1F2E2C] text-xs font-bold rounded-full">
                {schedule.timingInstruction}
              </span>
            </div>
          </div>
        </div>

        {!showReasonInput ? (
          <div className="space-y-4">
            {/* Responsible Person Selection */}
            <div className="bg-[#BFE8D6]/40 p-3 rounded-xl border border-[#BFE8D6]">
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                Quem está administrando a medicação agora?
              </label>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#2F7E6A]" />
                <span className="font-bold text-sm text-[#1F2E2C]">{userName}</span>
                <select
                  value={responsibleRole}
                  onChange={(e) => setResponsibleRole(e.target.value as any)}
                  className="ml-auto bg-white border border-[#63C6A7] text-xs font-bold py-1 px-2 rounded-lg text-[#1F2E2C]"
                >
                  <option value="Cuidador">Cuidador</option>
                  <option value="Paciente">Próprio Paciente</option>
                  <option value="Filho">Filho(a)</option>
                  <option value="Esposa">Esposa / Marido</option>
                  <option value="Curador">Curador</option>
                  <option value="Enfermeiro">Enfermeiro</option>
                  <option value="Outro">Outro Responsável</option>
                </select>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleConfirmAdministered}
                className="py-4 px-4 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition"
              >
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                Medicamento Administrado
              </button>

              <button
                onClick={() => setShowReasonInput(true)}
                className="py-4 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition"
              >
                <XCircle className="w-6 h-6 stroke-[2.5]" />
                Não Administrado
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-xs font-bold text-[#2F7E6A] hover:underline"
              >
                Cancelar / Lembrar Mais Tarde
              </button>
            </div>
          </div>
        ) : (
          /* Reason input form when marked as Not Administered */
          <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-rose-300">
            <h4 className="font-bold text-rose-700 flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-5 h-5" /> Registrar Motivo da Não Administração:
            </h4>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl font-semibold text-sm text-[#1F2E2C]"
            >
              <option value="Recusou o medicamento">Paciente recusou a medicação</option>
              <option value="Paciente apresentava mal-estar / náusea">Paciente apresentava mal-estar ou náusea</option>
              <option value="Paciente dormindo">Paciente dormindo profundamente</option>
              <option value="Sem estoque do medicamento">Falta de estoque do medicamento</option>
              <option value="Orientação médica temporária de suspensão">Orientação médica de suspender dose</option>
              <option value="Outro">Outro motivo especificado abaixo</option>
            </select>

            {reason === 'Outro' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Descreva detalhadamente o motivo..."
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl font-medium text-xs text-[#1F2E2C]"
                rows={2}
              />
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmNotAdministered}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow transition"
              >
                Confirmar Registro
              </button>
              <button
                onClick={() => setShowReasonInput(false)}
                className="py-3 px-4 bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
