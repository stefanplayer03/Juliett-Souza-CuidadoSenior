import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { MedicalRecord } from '../types';
import {
  FileText,
  Plus,
  Stethoscope,
  Calendar,
  Paperclip,
  ExternalLink,
  Edit2,
  FileCheck,
} from 'lucide-react';

export const MedicalRecordView: React.FC = () => {
  const { medicalRecords, medications, addMedicalRecord, updateMedicalRecord } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const userName = currentUser?.displayName || 'Administrador';

  const resetForm = () => {
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
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: MedicalRecord) => {
    setEditingId(rec.id);
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
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (editingId) {
      updateMedicalRecord(editingId, payload, userName);
    } else {
      addMedicalRecord(payload, userName);
    }

    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#2F7E6A]" /> Ficha Médica e Prescrições
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Motivos de uso, sintomas, diagnósticos com CID e receitas/exames anexados
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Registrar Ficha Médica
          </button>
        )}
      </div>

      {/* Medical Records Cards */}
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
                      onClick={() => handleOpenEdit(rec)}
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-[#0] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#E9F7F2] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-[#1F2E2C] mb-4 pb-2 border-b border-[#BFE8D6]">
              {editingId ? 'Editar Ficha Médica' : 'Registrar Ficha Médica'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={() => setIsModalOpen(false)}
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
