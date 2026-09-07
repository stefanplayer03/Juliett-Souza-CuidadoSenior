import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MedicalRecord, MedicalAppointment, AppointmentType } from '../types';
import {
  FileText,
  Plus,
  Stethoscope,
  Calendar as CalendarIcon,
  Paperclip,
  ExternalLink,
  Edit2,
  FileCheck,
  AlertTriangle,
  Volume2,
  MessageCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Upload,
  FileCode,
  X,
} from 'lucide-react';
import { audioService } from '../services/audio';
import { openWhatsAppAppointmentReminder } from '../utils/whatsapp';

export const MedicalRecordView: React.FC = () => {
  const {
    medicalRecords,
    medications,
    addMedicalRecord,
    updateMedicalRecord,
    medicalAppointments,
    addMedicalAppointment,
    updateMedicalAppointment,
    deleteMedicalAppointment,
    patient,
    caregivers,
  } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState<'appointments' | 'records'>('appointments');

  // Modal states for Medical Records
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [medicationId, setMedicationId] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [cid, setCid] = useState('');
  const [doctorName, setDoctorName] = useState('Dra. Ana Costa');
  const [crm, setCrm] = useState('CRM/SP 45678');
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Modal states for Appointments & Exams
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  const [appType, setAppType] = useState<AppointmentType>('exame');
  const [appTitle, setAppTitle] = useState('');
  const [appSpecialty, setAppSpecialty] = useState('');
  const [appDoctorOrClinic, setAppDoctorOrClinic] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appDateTime, setAppDateTime] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [appPrepInstructions, setAppPrepInstructions] = useState('');
  const [appAttachmentUrl, setAppAttachmentUrl] = useState('');
  const [appAttachmentName, setAppAttachmentName] = useState('');
  const [appNotes, setAppNotes] = useState('');

  const userName = currentUser?.displayName || 'Administrador';

  // Find 1-day advance upcoming appointments for Visual/Sound Alert
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const upcomingAlertAppointments = medicalAppointments.filter((app) => {
    if (app.status === 'concluido') return false;
    const appDateStr = app.dateTime.split('T')[0];
    return appDateStr === tomorrowStr || appDateStr === todayStr;
  });

  const resetRecordForm = () => {
    setMedicationId('');
    setReason('');
    setSymptoms('');
    setDiagnosis('');
    setCid('');
    setDoctorName('Dra. Ana Costa');
    setCrm('CRM/SP 45678');
    setConsultationDate(new Date().toISOString().split('T')[0]);
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setAttachmentUrl('');
    setEditingRecordId(null);
  };

  const resetAppointmentForm = () => {
    setAppType('exame');
    setAppTitle('');
    setAppSpecialty('');
    setAppDoctorOrClinic('');
    setAppAddress('');
    setAppDateTime(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setAppPrepInstructions('');
    setAppAttachmentUrl('');
    setAppAttachmentName('');
    setAppNotes('');
    setEditingAppId(null);
  };

  const handleOpenCreateRecord = () => {
    resetRecordForm();
    setIsRecordModalOpen(true);
  };

  const handleOpenEditRecord = (rec: MedicalRecord) => {
    setEditingRecordId(rec.id);
    setMedicationId(rec.medicationId || '');
    setReason(rec.reason);
    setSymptoms(rec.symptoms);
    setDiagnosis(rec.diagnosis);
    setCid(rec.cid || '');
    setDoctorName(rec.doctorName);
    setCrm(rec.crm);
    setConsultationDate(rec.consultationDate);
    setPrescriptionDate(rec.prescriptionDate);
    setNotes(rec.notes);
    setAttachmentUrl(rec.attachmentUrl || '');
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !doctorName) return;

    const payload = {
      medicationId,
      reason,
      symptoms,
      diagnosis,
      cid,
      doctorName,
      crm,
      consultationDate,
      prescriptionDate,
      notes,
      attachmentUrl,
    };

    if (editingRecordId) {
      updateMedicalRecord(editingRecordId, payload, userName);
    } else {
      addMedicalRecord(payload, userName);
    }

    setIsRecordModalOpen(false);
    resetRecordForm();
  };

  const handleOpenCreateAppointment = () => {
    resetAppointmentForm();
    setIsAppointmentModalOpen(true);
  };

  const handleOpenEditAppointment = (app: MedicalAppointment) => {
    setEditingAppId(app.id);
    setAppType(app.type);
    setAppTitle(app.title);
    setAppSpecialty(app.specialtyOrExam);
    setAppDoctorOrClinic(app.doctorOrClinic);
    setAppAddress(app.addressOrLocation || '');
    setAppDateTime(app.dateTime);
    setAppPrepInstructions(app.prepInstructions || '');
    setAppAttachmentUrl(app.attachmentUrl || '');
    setAppAttachmentName(app.attachmentName || '');
    setAppNotes(app.notes || '');
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle || !appDoctorOrClinic || !appDateTime) return;

    const payload = {
      type: appType,
      title: appTitle,
      specialtyOrExam: appSpecialty || appType,
      doctorOrClinic: appDoctorOrClinic,
      addressOrLocation: appAddress,
      dateTime: appDateTime,
      prepInstructions: appPrepInstructions,
      status: 'agendado' as const,
      attachmentUrl: appAttachmentUrl,
      attachmentName: appAttachmentName || (appAttachmentUrl ? 'Anexo_Documento.pdf' : undefined),
      notes: appNotes,
    };

    if (editingAppId) {
      updateMedicalAppointment(editingAppId, payload, userName);
    } else {
      addMedicalAppointment(payload, userName);
    }

    setIsAppointmentModalOpen(false);
    resetAppointmentForm();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAppAttachmentName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setAppAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeakAppointmentAlert = (app: MedicalAppointment) => {
    const isExame = app.type === 'exame';
    const dateFormatted = new Date(app.dateTime).toLocaleString('pt-BR');
    const prepText = app.prepInstructions ? `. Preparo necessário: ${app.prepInstructions}` : '';
    const text = `Atenção! Lembrete com antecedência de ${isExame ? 'exame' : 'consulta'}: ${app.title} agendado para ${dateFormatted} no local ${app.doctorOrClinic}${prepText}`;
    audioService.speakText(text);
  };

  const handleWhatsAppNotify = (app: MedicalAppointment) => {
    const activeCaregiver = caregivers.find((c) => c.isCurrentlyOnDuty) || caregivers[0];
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

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-[#2F7E6A]" /> Consultas, Exames & Histórico
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Gestão de agendamentos com alerta de antecedência, preparo para exames, anexos em PDF e fichas médicas
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-[#BFE8D6]">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 font-black text-xs rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'bg-[#2F7E6A] text-white shadow'
                : 'text-[#1F2E2C] hover:bg-[#E9F7F2]'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Consultas & Exames
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 font-black text-xs rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'records'
                ? 'bg-[#2F7E6A] text-white shadow'
                : 'text-[#1F2E2C] hover:bg-[#E9F7F2]'
            }`}
          >
            <FileText className="w-4 h-4" /> Fichas Médicas & Receitas
          </button>
        </div>
      </div>

      {/* 1-DAY ADVANCE VISUAL & ACOUSTIC ALERT BANNER */}
      {upcomingAlertAppointments.length > 0 && (
        <div className="bg-amber-50 border-4 border-amber-400 rounded-3xl p-5 shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500 text-white rounded-xl shadow animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                  ALERTA DE ANTECEDÊNCIA (1 DIA / HOJE)
                </span>
                <h3 className="text-base font-black text-amber-900">
                  Próximas Consultas / Exames Requerendo Atenção
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700">
              {upcomingAlertAppointments.length} agendamento(s) próximo(s)
            </span>
          </div>

          <div className="space-y-3">
            {upcomingAlertAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white p-4 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 font-extrabold text-[11px] rounded-md ${
                        app.type === 'exame' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {app.type === 'exame' ? 'EXAME MÉDICO' : 'CONSULTA MÉDICA'}
                    </span>
                    <h4 className="text-base font-black text-[#1F2E2C]">{app.title}</h4>
                  </div>
                  <p className="text-xs font-bold text-[#2F7E6A]">
                    📍 {app.doctorOrClinic} • 🗓️ {new Date(app.dateTime).toLocaleString('pt-BR')}
                  </p>
                  {app.prepInstructions && (
                    <div className="p-2.5 bg-amber-100/70 rounded-xl border border-amber-300 text-xs text-amber-900 font-semibold mt-1">
                      ⚠️ <strong>Instruções de Preparo para Exame:</strong> {app.prepInstructions}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSpeakAppointmentAlert(app)}
                    className="px-3 py-2 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] font-extrabold text-xs rounded-xl flex items-center gap-1 shadow"
                    title="Ouvir lembrete e preparo em voz alta"
                  >
                    <Volume2 className="w-4 h-4" /> Ouvir Alerta
                  </button>
                  <button
                    onClick={() => handleWhatsAppNotify(app)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow"
                    title="Enviar aviso no WhatsApp do Cuidador"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: CONSULTAS E EXAMES A REALIZAR */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[#2F7E6A]" /> Agendamentos de Consultas e Exames
            </h3>
            <button
              onClick={handleOpenCreateAppointment}
              className="px-5 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Incluir Nova Consulta / Exame
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medicalAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm flex flex-col justify-between hover:border-[#63C6A7] transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 font-extrabold text-[10px] rounded-md uppercase mb-1 ${
                          app.type === 'exame'
                            ? 'bg-purple-100 text-purple-700 border border-purple-300'
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}
                      >
                        {app.type === 'exame' ? 'Exame Laboratorial / Imagem' : 'Consulta Médica'}
                      </span>
                      <h4 className="text-xl font-black text-[#1F2E2C]">{app.title}</h4>
                      <p className="text-xs font-bold text-[#2F7E6A] mt-0.5">
                        {app.doctorOrClinic} ({app.specialtyOrExam})
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleWhatsAppNotify(app)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                        title="Notificar Responsável via WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditAppointment(app)}
                        className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl"
                        title="Editar agendamento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMedicalAppointment(app.id, userName)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#BFE8D6] space-y-2 text-xs text-[#1F2E2C]">
                    <div className="flex items-center gap-2 font-bold text-[#2F7E6A]">
                      <Clock className="w-4 h-4" /> Data e Horário:
                      <span className="bg-[#E9F7F2] px-2.5 py-0.5 rounded-md border border-[#63C6A7]">
                        {new Date(app.dateTime).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {app.addressOrLocation && (
                      <p className="text-xs font-semibold text-gray-600">
                        <strong>Local:</strong> {app.addressOrLocation}
                      </p>
                    )}

                    {/* Preparation instructions for exams */}
                    {app.prepInstructions && (
                      <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 text-xs text-amber-900 space-y-1">
                        <strong className="flex items-center gap-1 font-black text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-600" /> Preparo Necessário para o Exame:
                        </strong>
                        <p className="font-semibold">{app.prepInstructions}</p>
                      </div>
                    )}

                    {app.notes && (
                      <p className="text-xs text-gray-600 italic bg-[#E9F7F2] p-2.5 rounded-xl border border-[#63C6A7]">
                        "{app.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* PDF Attachment preview/link */}
                {app.attachmentUrl && (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-[#2F7E6A]" /> {app.attachmentName || 'Anexo PDF / Foto'}
                    </span>
                    <a
                      href={app.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#63C6A7] text-[#1F2E2C] font-extrabold rounded-xl flex items-center gap-1 hover:bg-[#52b596]"
                    >
                      Visualizar PDF <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FICHAS MÉDICAS E PRESCRIÇÕES */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#2F7E6A]" /> Registros de Fichas Médicas e Receitas
            </h3>
            {isAdmin && (
              <button
                onClick={handleOpenCreateRecord}
                className="px-5 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Registrar Ficha Médica
              </button>
            )}
          </div>

          <div className="space-y-4">
            {medicalRecords.map((rec) => {
              const associatedMed = medications.find((m) => m.id === rec.medicationId);

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4 hover:border-[#63C6A7] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BFE8D6]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#E9F7F2] border border-[#63C6A7] flex items-center justify-center text-[#2F7E6A] shrink-0">
                        <FileCheck className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#1F2E2C]">
                          {associatedMed ? associatedMed.name : 'Prescrição Geral'}
                        </h3>
                        <p className="text-xs font-bold text-[#2F7E6A]">
                          Médico Prescritor: {rec.doctorName} ({rec.crm})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                        Consulta: {new Date(rec.consultationDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEditRecord(rec)}
                          className="p-2 text-gray-500 hover:text-[#2F7E6A] hover:bg-[#E9F7F2] rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#1F2E2C]">
                    <div className="bg-[#E9F7F2]/60 p-3.5 rounded-2xl border border-[#BFE8D6] space-y-1">
                      <span className="font-extrabold text-[#2F7E6A] block uppercase text-[10px]">
                        Motivo da Utilização
                      </span>
                      <p className="font-semibold">{rec.reason}</p>
                    </div>

                    <div className="bg-[#E9F7F2]/60 p-3.5 rounded-2xl border border-[#BFE8D6] space-y-1">
                      <span className="font-extrabold text-[#2F7E6A] block uppercase text-[10px]">
                        Sintomas Relatados
                      </span>
                      <p className="font-semibold">{rec.symptoms}</p>
                    </div>

                    <div className="bg-[#E9F7F2]/60 p-3.5 rounded-2xl border border-[#BFE8D6] space-y-1">
                      <span className="font-extrabold text-[#2F7E6A] block uppercase text-[10px]">
                        Diagnóstico Clínico
                      </span>
                      <p className="font-bold text-[#1F2E2C]">
                        {rec.diagnosis} {rec.cid && <span className="text-[#2F7E6A] font-black">(CID: {rec.cid})</span>}
                      </p>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <strong>Observações Médicas:</strong> {rec.notes}
                    </div>
                  )}

                  {/* Attachment link */}
                  {rec.attachmentUrl && (
                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-[#2F7E6A]" /> Receita Médica / Anexo em PDF
                      </span>
                      <a
                        href={rec.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#63C6A7] text-[#1F2E2C] font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs hover:bg-[#52b596]"
                      >
                        Visualizar Anexo <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* APPOINTMENT & EXAM MODAL */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-xl font-black text-[#1F2E2C]">
                {editingAppId ? 'Editar Agendamento' : 'Incluir Nova Consulta ou Exame'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Tipo de Agendamento *</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as any)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  >
                    <option value="exame">Exame Médico / Laboratorial</option>
                    <option value="consulta">Consulta Médica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Título do Compromisso *</label>
                  <input
                    type="text"
                    required
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="Ex: Hemograma Completo ou Consulta Cardiologia"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Médico / Clínica / Laboratório *</label>
                  <input
                    type="text"
                    required
                    value={appDoctorOrClinic}
                    onChange={(e) => setAppDoctorOrClinic(e.target.value)}
                    placeholder="Ex: Dra. Ana Costa ou Lab Fleury"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Especialidade / Tipo de Exame</label>
                  <input
                    type="text"
                    value={appSpecialty}
                    onChange={(e) => setAppSpecialty(e.target.value)}
                    placeholder="Ex: Geriatria, Ultrassom, Sangue"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Data e Horário *</label>
                  <input
                    type="datetime-local"
                    required
                    value={appDateTime}
                    onChange={(e) => setAppDateTime(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Endereço / Sala (Opcional)</label>
                  <input
                    type="text"
                    value={appAddress}
                    onChange={(e) => setAppAddress(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Sala 302"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Exam Preparation Field */}
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">
                  Instruções de Preparo para Exame (Jejum, Medicamentos, Água)
                </label>
                <textarea
                  value={appPrepInstructions}
                  onChange={(e) => setAppPrepInstructions(e.target.value)}
                  placeholder="Ex: Jejum obrigatório de 12 horas. Beber 1 litro de água 1 hora antes..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                  rows={2}
                />
              </div>

              {/* PDF File Attachment & Link */}
              <div className="space-y-2 bg-white p-3.5 rounded-2xl border-2 border-[#BFE8D6]">
                <label className="block text-xs font-bold text-[#1F2E2C]">
                  Anexo de Documento / PDF da Consulta / Exame
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 font-bold block mb-1">Upload de arquivo local (PDF/Imagem):</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#2F7E6A] file:text-white hover:file:bg-[#256555]"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-500 font-bold block mb-1">Ou cole a URL do PDF online:</span>
                    <input
                      type="url"
                      value={appAttachmentUrl}
                      onChange={(e) => setAppAttachmentUrl(e.target.value)}
                      placeholder="https://exemplo.com/exame.pdf"
                      className="w-full p-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
                {appAttachmentName && (
                  <p className="text-xs font-bold text-[#2F7E6A] flex items-center gap-1 mt-1">
                    <Paperclip className="w-3.5 h-3.5" /> Arquivo selecionado: {appAttachmentName}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações Adicionais</label>
                <textarea
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  placeholder="Observações complementares..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2F7E6A] text-white font-extrabold rounded-xl text-xs shadow"
                >
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD FORM MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
              <h3 className="text-xl font-black text-[#1F2E2C]">
                {editingRecordId ? 'Editar Ficha Médica' : 'Registrar Ficha Médica'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Medicamento Relacionado</label>
                  <select
                    value={medicationId}
                    onChange={(e) => setMedicationId(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  >
                    <option value="">Nenhum (Prescrição Geral)</option>
                    {medications.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dosage})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Motivo da Utilização *</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Controle de Hipertensão"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Sintomas</label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Ex: Tontura e dores na nuca"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Diagnóstico Clínico</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Ex: Hipertensão Estágio II"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CID (Opcional)</label>
                  <input
                    type="text"
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    placeholder="Ex: I10"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Médico Prescritor *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CRM do Médico</label>
                  <input
                    type="text"
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Data da Consulta</label>
                  <input
                    type="date"
                    value={consultationDate}
                    onChange={(e) => setConsultationDate(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">URL da Receita em PDF ou Foto</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://exemplo.com/receita-medica.pdf"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações Médicas Complementares</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#BFE8D6]">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2F7E6A] text-white font-extrabold rounded-xl text-xs shadow"
                >
                  Salvar Ficha Médica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
