import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CaregiverRelation, PharmaceuticalForm, TimingInstruction } from '../types';
import {
  User,
  Users,
  FileText,
  Pill,
  CheckCircle2,
  Shield,
  Heart,
  Clock,
  Phone,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  Volume2,
  KeyRound
} from 'lucide-react';
import { audioService } from '../services/audio';

interface FirstPatientSetupWizardProps {
  onClose?: () => void;
}

export const FirstPatientSetupWizard: React.FC<FirstPatientSetupWizardProps> = ({ onClose }) => {
  const { patient, updatePatient, addCaregiver, addMedication, addMedicalRecord, setIsFirstSetupOpen } = useApp();
  const { currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Patient Details
  const [fullName, setFullName] = useState(patient.fullName || currentUser?.displayName || '');
  const [cpf, setCpf] = useState(patient.cpf && patient.cpf !== 'Não informado' ? patient.cpf : '');
  const [birthDate, setBirthDate] = useState(patient.birthDate || '1955-01-01');
  const [phone, setPhone] = useState(patient.phone || currentUser?.phone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient.emergencyPhone || '');
  const [address, setAddress] = useState(patient.address || '');
  const [bloodType, setBloodType] = useState(patient.bloodType || 'O+');
  const [weight, setWeight] = useState(patient.weight || 65);
  const [height, setHeight] = useState(patient.height || 1.60);

  // Step 2: Medical Details
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [allergyInput, setAllergyInput] = useState('');
  const [diseases, setDiseases] = useState<string[]>(patient.diseases || []);
  const [diseaseInput, setDiseaseInput] = useState('');
  const [notes, setNotes] = useState(patient.notes || '');

  // Step 3: Responsible / Caregivers
  interface TempCaregiver {
    name: string;
    relationship: CaregiverRelation;
    phone: string;
    email: string;
    isCurrentlyOnDuty: boolean;
    receiveNotifications: boolean;
    username?: string;
    accessPassword?: string;
    canAdministerMeds?: boolean;
    canEditData?: boolean;
  }

  const [caregiversList, setCaregiversList] = useState<TempCaregiver[]>([
    {
      name: '',
      relationship: 'Filha',
      phone: '',
      email: '',
      isCurrentlyOnDuty: true,
      receiveNotifications: true,
      username: '',
      accessPassword: 'Familia2026',
      canAdministerMeds: true,
      canEditData: false,
    },
  ]);

  // Step 4: Initial Medications
  interface TempMedication {
    name: string;
    dosage: string;
    pharmaceuticalForm: PharmaceuticalForm;
    scheduledTimes: string[];
    timingInstruction: TimingInstruction;
    stockQuantity: number;
    notes: string;
  }

  const [medicationsList, setMedicationsList] = useState<TempMedication[]>([
    {
      name: '',
      dosage: '1 comprimido',
      pharmaceuticalForm: 'Comprimido',
      scheduledTimes: ['08:00'],
      timingInstruction: 'Em jejum',
      stockQuantity: 30,
      notes: '',
    },
  ]);

  // Allergies helpers
  const handleAddAllergy = (val?: string) => {
    const toAdd = (val || allergyInput).trim();
    if (toAdd && !allergies.includes(toAdd)) {
      setAllergies([...allergies, toAdd]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  // Diseases helpers
  const handleAddDisease = (val?: string) => {
    const toAdd = (val || diseaseInput).trim();
    if (toAdd && !diseases.includes(toAdd)) {
      setDiseases([...diseases, toAdd]);
      setDiseaseInput('');
    }
  };

  const handleRemoveDisease = (item: string) => {
    setDiseases(diseases.filter((d) => d !== item));
  };

  // Caregiver helpers
  const handleCaregiverChange = (index: number, field: keyof TempCaregiver, val: any) => {
    const copy = [...caregiversList];
    const prevName = copy[index].name;
    copy[index] = { ...copy[index], [field]: val };
    
    // Auto-generate username from name if username is not custom-typed
    if (field === 'name' && typeof val === 'string') {
      const generated = val
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.');
      if (!copy[index].username || copy[index].username === prevName.toLowerCase().replace(/[^a-z0-9]/g, '.')) {
        copy[index].username = generated;
      }
    }

    setCaregiversList(copy);
  };

  const handleAddCaregiverRow = () => {
    setCaregiversList([
      ...caregiversList,
      {
        name: '',
        relationship: 'Cuidador',
        phone: '',
        email: '',
        isCurrentlyOnDuty: false,
        receiveNotifications: true,
        username: '',
        accessPassword: 'Familia2026',
        canAdministerMeds: true,
        canEditData: false,
      },
    ]);
  };

  const handleRemoveCaregiverRow = (index: number) => {
    if (caregiversList.length > 1) {
      setCaregiversList(caregiversList.filter((_, i) => i !== index));
    }
  };

  // Medication helpers
  const handleMedicationChange = (index: number, field: keyof TempMedication, val: any) => {
    const copy = [...medicationsList];
    copy[index] = { ...copy[index], [field]: val };
    setMedicationsList(copy);
  };

  const handleAddMedicationRow = () => {
    setMedicationsList([
      ...medicationsList,
      {
        name: '',
        dosage: '1 comprimido',
        pharmaceuticalForm: 'Comprimido',
        scheduledTimes: ['08:00'],
        timingInstruction: 'Depois da refeição',
        stockQuantity: 30,
        notes: '',
      },
    ]);
  };

  const handleRemoveMedicationRow = (index: number) => {
    if (medicationsList.length > 1) {
      setMedicationsList(medicationsList.filter((_, i) => i !== index));
    }
  };

  // Final submit handler
  const handleFinishSetup = async () => {
    setIsSubmitting(true);
    const userName = currentUser?.displayName || fullName || 'Paciente';

    try {
      // 1. Update Patient details
      updatePatient(
        patient.id,
        {
          fullName: fullName.trim() || patient.fullName,
          cpf: cpf.trim() || patient.cpf,
          birthDate,
          phone: phone.trim() || patient.phone,
          emergencyPhone: emergencyPhone.trim() || patient.emergencyPhone,
          address: address.trim() || patient.address,
          bloodType,
          weight: Number(weight) || 65,
          height: Number(height) || 1.6,
          allergies,
          diseases,
          notes: notes.trim() || patient.notes,
          isFirstSetupCompleted: true,
        },
        userName
      );

      // 2. Add Caregivers & Provision Sub-Accounts
      for (const cg of caregiversList) {
        if (cg.name.trim()) {
          const generatedUsername = cg.username?.trim() || cg.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.') || `resp.${Math.floor(1000 + Math.random() * 9000)}`;
          const assignedPassword = cg.accessPassword?.trim() || 'Familia2026';
          addCaregiver(
            {
              name: cg.name.trim(),
              relationship: cg.relationship,
              phone: cg.phone.trim() || phone,
              email: cg.email.trim() || currentUser?.email || '',
              isCurrentlyOnDuty: cg.isCurrentlyOnDuty,
              receiveNotifications: cg.receiveNotifications,
              username: generatedUsername,
              accessPassword: assignedPassword,
              canAdministerMeds: cg.canAdministerMeds ?? true,
              canEditData: cg.canEditData ?? false,
            },
            userName
          );
        }
      }

      // 3. Add Medical Record summary
      if (diseases.length > 0 || notes.trim()) {
        addMedicalRecord(
          {
            medicationId: '',
            reason: 'Primeiro cadastro médico do paciente.',
            symptoms: diseases.join(', ') || 'Sem sintomas agudos reportados.',
            diagnosis: diseases.length > 0 ? `Condições registradas: ${diseases.join(', ')}` : 'Avaliação inicial de rotina',
            cid: 'R69',
            doctorName: 'Clínico do Paciente',
            crm: 'CRM/SP',
            consultationDate: new Date().toISOString().split('T')[0],
            prescriptionDate: new Date().toISOString().split('T')[0],
            notes: notes.trim() || 'Ficha clínica inicial preenchida durante o primeiro cadastro.',
          },
          userName
        );
      }

      // 4. Add Medications
      for (const med of medicationsList) {
        if (med.name.trim()) {
          addMedication(
            {
              name: med.name.trim(),
              photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
              dosage: med.dosage.trim() || '1 comprimido',
              pharmaceuticalForm: med.pharmaceuticalForm,
              stockQuantity: Number(med.stockQuantity) || 30,
              scheduledTimes: med.scheduledTimes.length > 0 ? med.scheduledTimes : ['08:00'],
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startDate: new Date().toISOString().split('T')[0],
              isContinuous: true,
              soundAlarmEnabled: true,
              timingInstruction: med.timingInstruction,
              notes: med.notes.trim() || 'Cadastrado no primeiro acesso.',
            },
            userName
          );
        }
      }

      audioService.playClickSound();
      audioService.speakText('Primeiro cadastro concluído com sucesso. Bem-vindo ao Cuidado Sênior!');

      setIsFirstSetupOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Erro ao finalizar primeiro cadastro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#2F7E6A] w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Top Header Banner */}
        <div className="bg-[#2F7E6A] text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#63C6A7] text-[#1F2E2C] flex items-center justify-center font-black shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-white/20 rounded-md">
                  PRIMEIRO ACESSO DO PACIENTE
                </span>
                <span className="text-[10px] font-bold text-[#BFE8D6] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Cadastro Seguro e Privado
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Cadastro de Ficha Médica, Responsáveis e Medicamentos
              </h2>
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-[#E9F7F2] border-b border-[#BFE8D6] px-4 py-3 shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl text-xs font-bold transition text-left ${
                currentStep === 1
                  ? 'bg-[#2F7E6A] text-white shadow-sm'
                  : currentStep > 1
                  ? 'bg-white text-[#2F7E6A] border border-[#63C6A7]'
                  : 'bg-white/60 text-gray-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentStep === 1 ? 'bg-white text-[#2F7E6A]' : 'bg-[#63C6A7] text-[#1F2E2C]'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline truncate">1. Seus Dados</span>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl text-xs font-bold transition text-left ${
                currentStep === 2
                  ? 'bg-[#2F7E6A] text-white shadow-sm'
                  : currentStep > 2
                  ? 'bg-white text-[#2F7E6A] border border-[#63C6A7]'
                  : 'bg-white/60 text-gray-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentStep === 2 ? 'bg-white text-[#2F7E6A]' : 'bg-[#63C6A7] text-[#1F2E2C]'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline truncate">2. Ficha Médica</span>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl text-xs font-bold transition text-left ${
                currentStep === 3
                  ? 'bg-[#2F7E6A] text-white shadow-sm'
                  : currentStep > 3
                  ? 'bg-white text-[#2F7E6A] border border-[#63C6A7]'
                  : 'bg-white/60 text-gray-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentStep === 3 ? 'bg-white text-[#2F7E6A]' : 'bg-[#63C6A7] text-[#1F2E2C]'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline truncate">3. Responsáveis</span>
            </button>

            {/* Step 4 */}
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className={`flex items-center justify-center sm:justify-start gap-2 p-2 rounded-xl text-xs font-bold transition text-left ${
                currentStep === 4
                  ? 'bg-[#2F7E6A] text-white shadow-sm'
                  : 'bg-white/60 text-gray-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  currentStep === 4 ? 'bg-white text-[#2F7E6A]' : 'bg-[#63C6A7] text-[#1F2E2C]'
                }`}
              >
                4
              </div>
              <span className="hidden sm:inline truncate">4. Medicamentos</span>
            </button>
          </div>
        </div>

        {/* Scrollable Step Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: PATIENT DATA */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#E9F7F2] p-3.5 rounded-2xl border border-[#BFE8D6] flex items-center gap-3">
                <User className="w-5 h-5 text-[#2F7E6A] shrink-0" />
                <p className="text-xs text-[#1F2E2C] font-semibold leading-relaxed">
                  Confirme seus dados principais de identificação. Estas informações garantem seu prontuário protegido e a correta identificação em todo o sistema.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Nome Completo do Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Irani Simões Augusto"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Telefone de Emergência
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                  Endereço Residencial
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Tipo Sanguíneo
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-bold focus:outline-none"
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
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Altura (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MEDICAL RECORD & ALLERGIES */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#E9F7F2] p-3.5 rounded-2xl border border-[#BFE8D6] flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#2F7E6A] shrink-0" />
                <p className="text-xs text-[#1F2E2C] font-semibold leading-relaxed">
                  Cadastre suas alergias e doenças pré-existentes. O sistema emitirá avisos caso algum remédio prescrito apresente risco.
                </p>
              </div>

              {/* Allergies Section */}
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] space-y-3">
                <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider">
                  Alergias a Medicamentos e Alimentos
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                    placeholder="Ex: Dipirona, Penicilina, Sulfa..."
                    className="flex-1 p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAllergy()}
                    className="px-4 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 py-0.5">Sugestões rápidas:</span>
                  {['Dipirona', 'Penicilina', 'Iodo', 'Anti-inflamatórios', 'Aspirina'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddAllergy(sug)}
                      className="px-2 py-0.5 bg-[#E9F7F2] hover:bg-[#BFE8D6] text-[#2F7E6A] text-[11px] font-extrabold rounded-lg transition"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                {/* Added Allergies Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {allergies.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Nenhuma alergia informada até o momento.</span>
                  ) : (
                    allergies.map((alg) => (
                      <span
                        key={alg}
                        className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-black flex items-center gap-1.5"
                      >
                        {alg}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(alg)}
                          className="hover:text-rose-950 font-black text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Diseases / Conditions Section */}
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] space-y-3">
                <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider">
                  Condições de Saúde e Doenças Crônicas
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={diseaseInput}
                    onChange={(e) => setDiseaseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDisease();
                      }
                    }}
                    placeholder="Ex: Hipertensão, Diabetes Tipo 2, Artrite..."
                    className="flex-1 p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDisease()}
                    className="px-4 py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white text-xs font-black rounded-xl shadow transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {/* Quick Disease Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 py-0.5">Sugestões comuns:</span>
                  {['Hipertensão Arterial', 'Diabetes Tipo 2', 'Osteoporose', 'Colesterol Alto', 'Glaucoma'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddDisease(sug)}
                      className="px-2 py-0.5 bg-[#E9F7F2] hover:bg-[#BFE8D6] text-[#2F7E6A] text-[11px] font-extrabold rounded-lg transition"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                {/* Added Diseases Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {diseases.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Nenhuma condição informada.</span>
                  ) : (
                    diseases.map((dis) => (
                      <span
                        key={dis}
                        className="px-3 py-1 bg-[#2F7E6A] text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        {dis}
                        <button
                          type="button"
                          onClick={() => handleRemoveDisease(dis)}
                          className="hover:text-red-200 font-black text-sm leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* General Medical Notes */}
              <div>
                <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                  Observações Médicas ou Recomendações Gerais
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Dificuldade para engolir comprimidos grandes, necessidade de beber água morna ao acordar, dieta com pouco sal..."
                  className="w-full p-3 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: RESPONSIBLES / CAREGIVERS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#E9F7F2] p-3.5 rounded-2xl border border-[#BFE8D6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#2F7E6A] shrink-0" />
                  <p className="text-xs text-[#1F2E2C] font-semibold leading-relaxed">
                    Cadastre seus responsáveis (filhos, cônjuges, cuidadores ou enfermeiros). Eles receberão avisos e poderão acompanhar suas medicações.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCaregiverRow}
                  className="px-3 py-1.5 bg-[#2F7E6A] hover:bg-[#256555] text-white text-xs font-black rounded-xl shadow transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Outro
                </button>
              </div>

              <div className="space-y-4">
                {caregiversList.map((cg, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] shadow-sm relative space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#BFE8D6]/60 pb-2">
                      <span className="text-xs font-black text-[#2F7E6A] flex items-center gap-1.5">
                        <User className="w-4 h-4" /> Responsável #{idx + 1}
                      </span>
                      {caregiversList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCaregiverRow(idx)}
                          className="text-gray-400 hover:text-rose-600 transition"
                          title="Remover responsável"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={cg.name}
                          onChange={(e) => handleCaregiverChange(idx, 'name', e.target.value)}
                          placeholder="Ex: Maria Santos (Filha)"
                          className="w-full p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Grau de Parentesco / Vínculo
                        </label>
                        <select
                          value={cg.relationship}
                          onChange={(e) => handleCaregiverChange(idx, 'relationship', e.target.value as CaregiverRelation)}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        >
                          <option value="Filha">Filha</option>
                          <option value="Filho">Filho</option>
                          <option value="Cuidador">Cuidador(a)</option>
                          <option value="Enfermeiro(a)">Enfermeiro(a)</option>
                          <option value="Esposa">Esposa</option>
                          <option value="Marido">Marido</option>
                          <option value="Responsável">Responsável Legal</option>
                          <option value="Curador">Curador</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Telefone / WhatsApp de Contato *
                        </label>
                        <input
                          type="tel"
                          required
                          value={cg.phone}
                          onChange={(e) => handleCaregiverChange(idx, 'phone', e.target.value)}
                          placeholder="(00) 90000-0000"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          E-mail (Opcional)
                        </label>
                        <input
                          type="email"
                          value={cg.email}
                          onChange={(e) => handleCaregiverChange(idx, 'email', e.target.value)}
                          placeholder="responsavel@email.com"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Sub-account Login Credentials Box */}
                    <div className="bg-[#E9F7F2] p-3 rounded-xl border border-[#63C6A7] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#2F7E6A]">
                        <KeyRound className="w-3.5 h-3.5 text-[#2F7E6A]" />
                        <span>Subcadastro de Acesso (Login & Senha do Responsável)</span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-medium">
                        O responsável receberá este login e senha para acessar com segurança exclusivamente os dados e medicações de <strong>{fullName || patient.fullName}</strong>.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                            Usuário de Acesso
                          </label>
                          <input
                            type="text"
                            value={cg.username || ''}
                            onChange={(e) => handleCaregiverChange(idx, 'username', e.target.value)}
                            placeholder="Ex: maria.santos"
                            className="w-full p-2 bg-white border border-[#63C6A7] rounded-lg text-xs font-bold text-[#1F2E2C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-[#1F2E2C] uppercase mb-1">
                            Senha de Acesso Provisória
                          </label>
                          <input
                            type="text"
                            value={cg.accessPassword || ''}
                            onChange={(e) => handleCaregiverChange(idx, 'accessPassword', e.target.value)}
                            placeholder="Ex: Familia2026"
                            className="w-full p-2 bg-white border border-[#63C6A7] rounded-lg text-xs font-mono font-bold text-[#1F2E2C]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                          <input
                            type="checkbox"
                            checked={cg.canAdministerMeds ?? true}
                            onChange={(e) => handleCaregiverChange(idx, 'canAdministerMeds', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#2F7E6A] rounded"
                          />
                          Pode Confirmar Remédios Ministrados
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                          <input
                            type="checkbox"
                            checked={cg.canEditData ?? false}
                            onChange={(e) => handleCaregiverChange(idx, 'canEditData', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#2F7E6A] rounded"
                          />
                          Pode Editar Agenda e Informações Médicas
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                        <input
                          type="checkbox"
                          checked={cg.isCurrentlyOnDuty}
                          onChange={(e) => handleCaregiverChange(idx, 'isCurrentlyOnDuty', e.target.checked)}
                          className="w-4 h-4 text-[#2F7E6A] rounded focus:ring-0"
                        />
                        Responsável de Plantão Principal no Momento
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1F2E2C]">
                        <input
                          type="checkbox"
                          checked={cg.receiveNotifications}
                          onChange={(e) => handleCaregiverChange(idx, 'receiveNotifications', e.target.checked)}
                          className="w-4 h-4 text-[#2F7E6A] rounded focus:ring-0"
                        />
                        Receber Alertas de Medicamentos e Emergência
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: MEDICATIONS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#E9F7F2] p-3.5 rounded-2xl border border-[#BFE8D6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-[#2F7E6A] shrink-0" />
                  <p className="text-xs text-[#1F2E2C] font-semibold leading-relaxed">
                    Cadastre seus remédios de rotina com horários e dosagens. O sistema irá gerar automaticamente o calendário de alarmes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedicationRow}
                  className="px-3 py-1.5 bg-[#2F7E6A] hover:bg-[#256555] text-white text-xs font-black rounded-xl shadow transition shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Outro Remédio
                </button>
              </div>

              <div className="space-y-4">
                {medicationsList.map((med, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] shadow-sm relative space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#BFE8D6]/60 pb-2">
                      <span className="text-xs font-black text-[#2F7E6A] flex items-center gap-1.5">
                        <Pill className="w-4 h-4" /> Medicamento #{idx + 1}
                      </span>
                      {medicationsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationRow(idx)}
                          className="text-gray-400 hover:text-rose-600 transition"
                          title="Remover medicamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Nome do Medicamento *
                        </label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                          placeholder="Ex: Losartana Potássica"
                          className="w-full p-2.5 bg-[#E9F7F2]/40 border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Dosagem *
                        </label>
                        <input
                          type="text"
                          required
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                          placeholder="Ex: 50mg - 1 comprimido"
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Forma Farmacêutica
                        </label>
                        <select
                          value={med.pharmaceuticalForm}
                          onChange={(e) => handleMedicationChange(idx, 'pharmaceuticalForm', e.target.value as PharmaceuticalForm)}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        >
                          <option value="Comprimido">Comprimido</option>
                          <option value="Gotas">Gotas</option>
                          <option value="Cápsula">Cápsula</option>
                          <option value="Pomada">Pomada</option>
                          <option value="Injeção">Injeção</option>
                          <option value="Xarope">Xarope</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Horário Programado
                        </label>
                        <input
                          type="time"
                          value={med.scheduledTimes[0] || '08:00'}
                          onChange={(e) => handleMedicationChange(idx, 'scheduledTimes', [e.target.value])}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Instrução de Tomada
                        </label>
                        <select
                          value={med.timingInstruction}
                          onChange={(e) => handleMedicationChange(idx, 'timingInstruction', e.target.value as TimingInstruction)}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-bold focus:outline-none"
                        >
                          <option value="Em jejum">Em jejum</option>
                          <option value="Antes da refeição">Antes da refeição</option>
                          <option value="Durante a refeição">Durante a refeição</option>
                          <option value="Depois da refeição">Depois da refeição</option>
                          <option value="Indiferente">Indiferente</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Quantidade em Estoque (Unidades)
                        </label>
                        <input
                          type="number"
                          value={med.stockQuantity}
                          onChange={(e) => handleMedicationChange(idx, 'stockQuantity', Number(e.target.value))}
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Observações do Medicamento
                        </label>
                        <input
                          type="text"
                          value={med.notes}
                          onChange={(e) => handleMedicationChange(idx, 'notes', e.target.value)}
                          placeholder="Ex: Tomar com bastante água."
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons Bar */}
        <div className="bg-[#E9F7F2] px-6 py-4 border-t border-[#BFE8D6] flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-[#1F2E2C] font-black text-xs rounded-xl shadow-sm border border-[#BFE8D6] transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            ) : (
              <span className="text-xs text-gray-500 font-bold">
                Passo 1 de 4
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
                className="px-6 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                Avançar <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinishSetup}
                className="px-7 py-3 bg-gradient-to-r from-[#2F7E6A] to-[#1F5547] hover:brightness-110 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-[#63C6A7]" />
                {isSubmitting ? 'Salvando...' : 'Concluir Cadastro do Paciente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
