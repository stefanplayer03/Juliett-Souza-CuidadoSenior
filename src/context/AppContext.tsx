import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Patient,
  Caregiver,
  Doctor,
  Medication,
  MedicalRecord,
  MedicalAppointment,
  ScheduleItem,
  HistoryLog,
  AppSettings,
  ActionType,
  CaregiverRelation,
  ScheduleStatus,
} from '../types';
import { audioService } from '../services/audio';
import { useAuth } from './AuthContext';
import {
  firestoreUsers,
  firestorePatients,
  firestoreCaregivers,
  firestoreDoctors,
  firestoreMedications,
  firestoreMedicalRecords,
  firestoreMedicalAppointments,
  firestoreSchedules,
  firestoreHistory,
} from '../firebase/db';

export type PerspectiveRole = 'paciente' | 'curador' | 'enfermeiro' | 'filhos';

interface AppContextType {
  patients: Patient[];
  activePatientId: string;
  patient: Patient;
  selectPatientById: (id: string) => void;
  addPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, userName: string) => void;
  updatePatient: (id: string, data: Partial<Patient>, userName: string) => void;
  deletePatient: (id: string, userName: string) => void;

  perspectiveRole: PerspectiveRole;
  setPerspectiveRole: (role: PerspectiveRole) => void;

  caregivers: Caregiver[];
  addCaregiver: (c: Omit<Caregiver, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => void;
  updateCaregiver: (id: string, c: Partial<Caregiver>, userName: string) => void;
  deleteCaregiver: (id: string, userName: string) => void;
  setCaregiverOnDuty: (id: string, userName: string) => void;
  activeCaregiverOnDuty: Caregiver | undefined;

  doctors: Doctor[];
  addDoctor: (d: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => void;
  updateDoctor: (id: string, d: Partial<Doctor>, userName: string) => void;
  deleteDoctor: (id: string, userName: string) => void;

  medications: Medication[];
  addMedication: (m: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => void;
  updateMedication: (id: string, m: Partial<Medication>, userName: string) => void;
  deleteMedication: (id: string, userName: string) => void;

  medicalRecords: MedicalRecord[];
  addMedicalRecord: (r: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => void;
  updateMedicalRecord: (id: string, r: Partial<MedicalRecord>, userName: string) => void;

  medicalAppointments: MedicalAppointment[];
  addMedicalAppointment: (a: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => void;
  updateMedicalAppointment: (id: string, a: Partial<MedicalAppointment>, userName: string) => void;
  deleteMedicalAppointment: (id: string, userName: string) => void;

  schedules: ScheduleItem[];
  confirmScheduleAdministered: (
    scheduleId: string,
    administeredBy: string,
    responsibleRole: CaregiverRelation | 'Paciente',
    notes?: string
  ) => void;
  markScheduleNotAdministered: (
    scheduleId: string,
    reason: string,
    administeredBy: string
  ) => void;
  regenerateSchedulesForDate: (dateStr: string) => void;
  regenerateSchedulesForDates: (dateStrs: string[]) => void;
  toggleScheduleSoundAlarm: (scheduleId: string, medicationId?: string) => void;
  toggleMedicationSoundAlarm: (medicationId: string) => void;

  historyLogs: HistoryLog[];

  currentView: string;
  setCurrentView: (view: string) => void;

  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // Active Pending Lembrete / Modal state
  pendingConfirmationSchedule: ScheduleItem | null;
  setPendingConfirmationSchedule: (item: ScheduleItem | null) => void;
  
  // PWA Offline status
  isOffline: boolean;

  // Onboarding setup wizard state
  isFirstSetupOpen: boolean;
  setIsFirstSetupOpen: (open: boolean) => void;
}

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'PAC-8842',
    fullName: 'Dona Francisca Alves de Souza',
    cpf: '123.456.789-00',
    birthDate: '1948-05-14',
    phone: '(11) 98765-4321',
    emergencyPhone: '(11) 99988-7766',
    address: 'Rua das Flores, 250, Apto 42 - São Paulo, SP',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    bloodType: 'O+',
    weight: 64.5,
    height: 1.58,
    allergies: ['Dipirona', 'Penicilina'],
    diseases: ['Hipertensão Arterial', 'Diabetes Tipo 2', 'Osteoporose'],
    notes: 'Necessita de acompanhamento para ingestão de líquidos pela manhã.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAC-1093',
    fullName: 'Sr. Antônio Carlos de Souza',
    cpf: '321.654.987-11',
    birthDate: '1942-11-20',
    phone: '(11) 97777-3333',
    emergencyPhone: '(11) 99988-7766',
    address: 'Av. Paulista, 1500 - São Paulo, SP',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    bloodType: 'A+',
    weight: 72.0,
    height: 1.70,
    allergies: ['Aspirina'],
    diseases: ['Cardiopatia', 'Hipertensão'],
    notes: 'Acompanhamento geriátrico regular.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PAC-4421',
    fullName: 'Dona Alzira Maria de Oliveira',
    cpf: '555.444.333-22',
    birthDate: '1951-03-08',
    phone: '(11) 96666-5555',
    emergencyPhone: '(11) 98888-1111',
    address: 'Rua Augusta, 800 - São Paulo, SP',
    photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300',
    bloodType: 'B+',
    weight: 58.0,
    height: 1.55,
    allergies: ['Sulfa'],
    diseases: ['Artrite Reumatóide'],
    notes: 'Cuidado especial com articulações.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg_1',
    patientId: 'PAC-8842',
    userId: 'user_cuidador_joao',
    username: 'joao.cuidador',
    accessPassword: 'Cuidador123',
    canAdministerMeds: true,
    canEditData: true,
    name: 'João Oliveira',
    relationship: 'Cuidador',
    phone: '(11) 98888-1111',
    email: 'joao.cuidador@gmail.com',
    isCurrentlyOnDuty: true,
    receiveNotifications: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cg_2',
    patientId: 'PAC-8842',
    userId: 'user_familiar_maria',
    username: 'maria.filha',
    accessPassword: 'Familia2026',
    canAdministerMeds: true,
    canEditData: true,
    name: 'Maria Santos Alves',
    relationship: 'Filha',
    phone: '(11) 97777-2222',
    email: 'maria.santos@gmail.com',
    isCurrentlyOnDuty: false,
    receiveNotifications: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cg_3',
    patientId: 'PAC-4421', // Vinculada ao cadastro principal da paciente Dona Alzira
    userId: 'user_irani_cuidadora',
    username: 'irani.cuidadora',
    accessPassword: 'Irani2026',
    canAdministerMeds: true,
    canEditData: true,
    name: 'Irani Simões',
    relationship: 'Cuidador',
    phone: '(11) 95555-4444',
    email: 'irani.simoes@gmail.com',
    isCurrentlyOnDuty: true,
    receiveNotifications: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dra. Ana Costa',
    specialty: 'Cardiologia & Geriatria',
    crm: 'CRM/SP 45678',
    phone: '(11) 3333-4444',
    clinic: 'Clínica Vida Senior - Unidade Paulista',
    notes: 'Consultas trimestrais de rotina cardiológica.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc_2',
    name: 'Dr. Roberto Lima',
    specialty: 'Endocrinologia',
    crm: 'CRM/SP 12345',
    phone: '(11) 3333-8888',
    clinic: 'Centro Médico Especializado',
    notes: 'Acompanhamento de glicemia e diabetes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med_1',
    name: 'Losartana Potássica',
    photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    dosage: '50mg - 1 comprimido',
    pharmaceuticalForm: 'Comprimido',
    stockQuantity: 45,
    scheduledTimes: ['08:00', '20:00'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: '2025-01-01',
    isContinuous: true,
    timingInstruction: 'Em jejum',
    notes: 'Tomar com um copo cheio de água pela manhã.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'med_2',
    name: 'Metformina',
    photo: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300',
    dosage: '850mg - 1 comprimido',
    pharmaceuticalForm: 'Comprimido',
    stockQuantity: 28,
    scheduledTimes: ['12:30'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: '2025-01-01',
    isContinuous: true,
    timingInstruction: 'Depois da refeição',
    notes: 'Tomar logo após o almoço.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'med_3',
    name: 'Alendronato de Sódio',
    photo: 'https://images.unsplash.com/photo-1550572017-edd951baa74c?w=300',
    dosage: '70mg - 1 comprimido',
    pharmaceuticalForm: 'Comprimido',
    stockQuantity: 4,
    scheduledTimes: ['07:00'],
    daysOfWeek: [0], // Domingos
    startDate: '2025-01-01',
    isContinuous: true,
    timingInstruction: 'Em jejum',
    notes: 'Permanecer sentado ou em pé por 30 minutos após a tomada.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'med_4',
    name: 'Colírio Glaustat',
    photo: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300',
    dosage: '2 gotas em cada olho',
    pharmaceuticalForm: 'Gotas',
    stockQuantity: 1,
    scheduledTimes: ['21:30'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: '2025-01-01',
    isContinuous: true,
    timingInstruction: 'Indiferente',
    notes: 'Aplicar antes de deitar.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'mr_1',
    medicationId: 'med_1',
    reason: 'Controle de pressão arterial alta (Hipertensão).',
    symptoms: 'Dores de cabeça ocasionais na nuca e tontura ao levantar.',
    diagnosis: 'Hipertensão Arterial Sistêmica Estágio II',
    cid: 'I10',
    doctorName: 'Dra. Ana Costa',
    crm: 'CRM/SP 45678',
    consultationDate: '2025-01-15',
    prescriptionDate: '2025-01-15',
    notes: 'Manter aferição diária de pressão e dieta hipossódica.',
    attachmentUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const getTodayString = () => new Date().toISOString().split('T')[0];

const getTomorrowISOString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0] + 'T08:30';
};

const DEFAULT_MEDICAL_APPOINTMENTS: MedicalAppointment[] = [
  {
    id: 'app_1',
    type: 'exame',
    title: 'Exame de Sangue e Glicemia em Jejum',
    specialtyOrExam: 'Laboratório de Análises Clínicas',
    doctorOrClinic: 'Laboratório Fleury - Unidade Jardins',
    addressOrLocation: 'Av. Brasil, 1200 - São Paulo, SP',
    dateTime: getTomorrowISOString(),
    prepInstructions: 'Jejum obrigatório de 12 horas. Beber 1 litro de água 1 hora antes do exame. Não suspender medicação contínua da pressão.',
    status: 'agendado',
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    attachmentName: 'Instrucoes_Preparo_Exame.pdf',
    notes: 'Resultado fica pronto em 2 dias úteis.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'app_2',
    type: 'consulta',
    title: 'Consulta Geriatria de Rotina',
    specialtyOrExam: 'Geriatria & Cardiologia',
    doctorOrClinic: 'Dra. Ana Costa',
    addressOrLocation: 'Clínica Vida Senior - Sala 402',
    dateTime: `${getTodayString()}T14:00`,
    prepInstructions: 'Levar carteira de vacinação, histórico de aferição de pressão dos últimos 15 dias e caixa dos medicamentos atuais.',
    status: 'agendado',
    attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400',
    attachmentName: 'Encaminhamento_Medico.pdf',
    notes: 'Avaliação de dosagem da Losartana.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const generateInitialSchedules = (meds: Medication[]): ScheduleItem[] => {
  const today = getTodayString();
  const schedules: ScheduleItem[] = [];

  meds.forEach((m) => {
    m.scheduledTimes.forEach((time, index) => {
      let status: ScheduleStatus = 'pending';
      let adminTime: string | undefined = undefined;
      let adminBy: string | undefined = undefined;
      let role: CaregiverRelation | 'Paciente' | undefined = undefined;

      // Mock some taken / pending status for today
      if (time === '07:00' || time === '08:00') {
        status = 'administered';
        adminTime = `${today} ${time}`;
        adminBy = 'João Oliveira';
        role = 'Cuidador';
      } else if (time === '12:30') {
        status = 'administered';
        adminTime = `${today} 12:34`;
        adminBy = 'João Oliveira';
        role = 'Cuidador';
      }

      schedules.push({
        id: `sch_${m.id}_${today}_${index}`,
        adminId: m.adminId || 'user_superadmin_juliett',
        patientId: m.patientId || 'PAC-8842',
        medicationId: m.id,
        medicationName: m.name,
        dosage: m.dosage,
        pharmaceuticalForm: m.pharmaceuticalForm,
        photo: m.photo,
        timingInstruction: m.timingInstruction,
        scheduledDate: today,
        scheduledTime: time,
        status,
        isContinuous: m.isContinuous || m.isMedicalPrep,
        treatmentDurationDays: m.treatmentDurationDays,
        startDate: m.startDate,
        endDate: m.endDate,
        soundAlarmEnabled: m.soundAlarmEnabled !== false,
        administeredAt: adminTime,
        administeredBy: adminBy,
        responsibleRole: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return schedules;
};

const DEFAULT_HISTORY: HistoryLog[] = [
  {
    id: 'hist_1',
    timestamp: `${getTodayString()} 08:02:14`,
    userName: 'João Oliveira',
    actionType: 'administracao',
    description: 'Medicamento Losartana Potássica (50mg) administrado pelo cuidador João Oliveira às 08:02.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hist_2',
    timestamp: `${getTodayString()} 12:34:05`,
    userName: 'João Oliveira',
    actionType: 'administracao',
    description: 'Medicamento Metformina (850mg) administrado pelo cuidador João Oliveira às 12:34.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hist_3',
    timestamp: '2025-01-15 10:00:00',
    userName: 'Dra. Ana Costa (Admin)',
    actionType: 'cadastro',
    description: 'Cadastro inicial de medicamentos e ficha médica da paciente Dona Francisca.',
    createdAt: new Date().toISOString(),
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Determine effective adminId for data partitioning:
  // If user is a clinical admin ('admin'), ownership is their own UID.
  // If user is an operator ('user'), ownership is their linked adminId or 'admin_root'.
  // If user is superadmin ('superadmin'), they can view and manage all.
  const currentAdminId =
    currentUser?.role === 'admin'
      ? currentUser.uid
      : currentUser?.adminId || 'admin_root';

  const [patients, setPatients] = useState<Patient[]>(() => {
    const s = localStorage.getItem('cs_patients_list');
    return s ? JSON.parse(s) : DEFAULT_PATIENTS;
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const s = localStorage.getItem('cs_active_patient_id');
    return s || (DEFAULT_PATIENTS[0] ? DEFAULT_PATIENTS[0].id : 'PAC-8842');
  });

  const [perspectiveRole, setPerspectiveRole] = useState<PerspectiveRole>('enfermeiro');

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0] || DEFAULT_PATIENTS[0];

  const [caregivers, setCaregivers] = useState<Caregiver[]>(() => {
    const s = localStorage.getItem('cs_caregivers');
    return s ? JSON.parse(s) : DEFAULT_CAREGIVERS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const s = localStorage.getItem('cs_doctors');
    return s ? JSON.parse(s) : DEFAULT_DOCTORS;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const s = localStorage.getItem('cs_medications');
    return s ? JSON.parse(s) : DEFAULT_MEDICATIONS;
  });

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(() => {
    const s = localStorage.getItem('cs_medical_records');
    return s ? JSON.parse(s) : DEFAULT_MEDICAL_RECORDS;
  });

  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointment[]>(() => {
    const s = localStorage.getItem('cs_medical_appointments');
    return s ? JSON.parse(s) : DEFAULT_MEDICAL_APPOINTMENTS;
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const s = localStorage.getItem('cs_schedules');
    return s ? JSON.parse(s) : generateInitialSchedules(DEFAULT_MEDICATIONS);
  });

  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => {
    const s = localStorage.getItem('cs_history');
    return s ? JSON.parse(s) : DEFAULT_HISTORY;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = localStorage.getItem('cs_settings');
    return s
      ? JSON.parse(s)
      : {
          fontSize: 'normal',
          soundEnabled: true,
          ttsEnabled: true,
          highContrast: false,
          autoEscalateMinutes: 15,
        };
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [pendingConfirmationSchedule, setPendingConfirmationSchedule] =
    useState<ScheduleItem | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isFirstSetupOpen, setIsFirstSetupOpen] = useState(false);

  // Firestore background initial sync
  useEffect(() => {
    const syncWithFirestore = async () => {
      try {
        const [
          remotePatients,
          remoteCaregivers,
          remoteDoctors,
          remoteMeds,
          remoteRecords,
          remoteAppointments,
          remoteSchedules,
          remoteHistory,
        ] = await Promise.all([
          firestorePatients.getAll(),
          firestoreCaregivers.getAll(),
          firestoreDoctors.getAll(),
          firestoreMedications.getAll(),
          firestoreMedicalRecords.getAll(),
          firestoreMedicalAppointments.getAll(),
          firestoreSchedules.getAll(),
          firestoreHistory.getAll(),
        ]);

        if (remotePatients.length > 0) {
          setPatients((prev) => {
            const map = new Map<string, Patient>();
            prev.forEach((p) => map.set(p.id, p));
            remotePatients.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
        if (remoteCaregivers.length > 0) setCaregivers(remoteCaregivers);
        if (remoteDoctors.length > 0) setDoctors(remoteDoctors);
        if (remoteMeds.length > 0) setMedications(remoteMeds);
        if (remoteRecords.length > 0) setMedicalRecords(remoteRecords);
        if (remoteAppointments.length > 0) setMedicalAppointments(remoteAppointments);
        if (remoteSchedules.length > 0) setSchedules(remoteSchedules);
        if (remoteHistory.length > 0) setHistoryLogs(remoteHistory);
      } catch (err) {
        console.warn('Firestore initial sync notice (using local state):', err);
      }
    };

    syncWithFirestore();
  }, [currentUser]);

  // Link / auto-create patient profile for patient accounts or bind sub-accounts to patient
  useEffect(() => {
    if (!currentUser) return;

    // 1. If currentUser is a sub-account or explicitly linked to a patientId
    if (currentUser.patientId) {
      const linkedPatient = patients.find((p) => p.id === currentUser.patientId);
      if (linkedPatient) {
        setActivePatientId(linkedPatient.id);
        return;
      }
    }

    // If currentUser is marked as a sub-account or has subaccount roles, do not create a separate patient
    if (
      currentUser.isSubAccount ||
      currentUser.role === 'responsavel' ||
      currentUser.role === 'cuidador'
    ) {
      return;
    }

    const isGeneralAdmin = currentUser.username?.toLowerCase() === 'juliett.souza';

    if (isGeneralAdmin) {
      // General Admin Juliett.Souza retains general supervision across all patients
      return;
    }

    if (currentUser.role === 'paciente' || (!isGeneralAdmin && currentUser.role !== 'admin')) {
      const existing = patients.find(
        (p) =>
          (p.userId && p.userId === currentUser.uid) ||
          p.fullName.toLowerCase().trim() === currentUser.displayName.toLowerCase().trim()
      );

      if (existing) {
        setActivePatientId(existing.id);
        if (existing.isFirstSetupCompleted === false) {
          setIsFirstSetupOpen(true);
        }
      } else {
        const customId = `PAC-${Math.floor(1000 + Math.random() * 9000)}`;
        const newP: Patient = {
          id: customId,
          userId: currentUser.uid,
          adminId: currentUser.adminId || currentUser.uid,
          fullName: currentUser.displayName || 'Novo Paciente',
          cpf: 'Não informado',
          birthDate: '1955-01-01',
          phone: currentUser.phone || '',
          emergencyPhone: '',
          address: '',
          photo: currentUser.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
          bloodType: 'O+',
          weight: 65,
          height: 1.6,
          allergies: [],
          diseases: [],
          notes: 'Paciente cadastrado no portal CuidadoSenior.',
          isFirstSetupCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPatients((prev) => [newP, ...prev]);
        setActivePatientId(customId);
        setIsFirstSetupOpen(true);
        firestorePatients.save(newP).catch(console.warn);
      }
    }
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.role, currentUser?.patientId, patients.length]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('cs_patients_list', JSON.stringify(patients));
    localStorage.setItem('cs_active_patient_id', activePatientId);
    localStorage.setItem('cs_patient', JSON.stringify(activePatient));
    localStorage.setItem('cs_caregivers', JSON.stringify(caregivers));
    localStorage.setItem('cs_doctors', JSON.stringify(doctors));
    localStorage.setItem('cs_medications', JSON.stringify(medications));
    localStorage.setItem('cs_medical_records', JSON.stringify(medicalRecords));
    localStorage.setItem('cs_medical_appointments', JSON.stringify(medicalAppointments));
    localStorage.setItem('cs_schedules', JSON.stringify(schedules));
    localStorage.setItem('cs_history', JSON.stringify(historyLogs));
    localStorage.setItem('cs_settings', JSON.stringify(settings));
  }, [patients, activePatientId, activePatient, caregivers, doctors, medications, medicalRecords, medicalAppointments, schedules, historyLogs, settings]);

  const addHistoryLog = (userName: string, actionType: ActionType, description: string) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now
      .toTimeString()
      .split(' ')[0]}`;
    const newLog: HistoryLog = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      timestamp: formattedDate,
      userName,
      actionType,
      description,
      createdAt: now.toISOString(),
    };
    setHistoryLogs((prev) => [newLog, ...prev]);
    firestoreHistory.save(newLog).catch(console.warn);
  };

  const selectPatientById = (id: string) => {
    const isGeneralAdmin = currentUser?.username?.toLowerCase() === 'juliett.souza';
    if (!isGeneralAdmin) {
      const allowedId = currentUser?.patientId || activePatientId;
      if (id !== allowedId) return;
    }
    const found = patients.find((p) => p.id === id);
    if (found) {
      setActivePatientId(id);
      addHistoryLog(
        isGeneralAdmin ? 'Administradora Geral' : (currentUser?.displayName || 'Usuário'),
        'alteracao',
        `Visualização alternada para o paciente ID: ${id} (${found.fullName}).`
      );
    }
  };

  const addPatient = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, userName: string) => {
    const customId = data.id || `PAC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newP: Patient = {
      ...data,
      id: customId,
      adminId: currentAdminId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPatients((prev) => [...prev, newP]);
    setActivePatientId(newP.id);
    addHistoryLog(userName, 'cadastro', `Novo paciente cadastrado com sucesso! ID: ${newP.id} (${newP.fullName}).`);
    firestorePatients.save(newP).catch(console.warn);
  };

  const updatePatient = (id: string, data: Partial<Patient>, userName: string) => {
    setPatients((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data, updatedAt: new Date().toISOString() };
          addHistoryLog(userName, 'alteracao', `Ficha do paciente ID: ${id} (${updated.fullName}) foi atualizada.`);
          firestorePatients.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  const deletePatient = (id: string, userName: string) => {
    const target = patients.find((p) => p.id === id);
    if (target) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      if (activePatientId === id) {
        const remaining = patients.filter((p) => p.id !== id);
        if (remaining.length > 0) setActivePatientId(remaining[0].id);
      }
      addHistoryLog(userName, 'exclusao', `Paciente ID: ${id} (${target.fullName}) removido do sistema.`);
      firestorePatients.delete(id).catch(console.warn);
    }
  };

  const addCaregiver = (
    c: Omit<Caregiver, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const cgId = `cg_${Date.now()}`;
    const generatedUsername =
      c.username && c.username.trim()
        ? c.username.trim()
        : `${c.name.toLowerCase().split(' ')[0]}.${c.relationship.toLowerCase().replace(/[^a-z]/g, '')}`;
    const generatedPassword = c.accessPassword && c.accessPassword.trim() ? c.accessPassword.trim() : 'Familia2026';
    const subUserId = c.userId || `user_sub_${cgId}`;

    const newC: Caregiver = {
      ...c,
      id: cgId,
      adminId: currentAdminId,
      patientId: activePatientId,
      userId: subUserId,
      username: generatedUsername,
      accessPassword: generatedPassword,
      canAdministerMeds: c.canAdministerMeds ?? true,
      canEditData: c.canEditData ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCaregivers((prev) => [...prev, newC]);
    addHistoryLog(
      userName,
      'cadastro',
      `Novo subcadastro de ${newC.relationship} ${newC.name} criado com login "${newC.username}" para a paciente.`
    );
    firestoreCaregivers.save(newC).catch(console.warn);

    // Synchronize with system authentication accounts so the sub-user can immediately sign in
    try {
      const rawUsers = localStorage.getItem('cs_system_users');
      const systemUsers: any[] = rawUsers ? JSON.parse(rawUsers) : [];
      const userExists = systemUsers.some(
        (u) => u.username?.toLowerCase() === generatedUsername.toLowerCase()
      );
      if (!userExists) {
        const newSubUser = {
          uid: subUserId,
          patientId: activePatientId,
          isSubAccount: true,
          relationship: newC.relationship,
          canAdministerMeds: newC.canAdministerMeds,
          canEditData: newC.canEditData,
          displayName: `${newC.name} (${newC.relationship})`,
          username: generatedUsername,
          email: newC.email || `${generatedUsername}@cuidadosenior.app`,
          role: newC.relationship === 'Cuidador' || newC.relationship === 'Enfermeiro(a)' ? 'cuidador' : 'responsavel',
          password: generatedPassword,
          isActive: true,
          mustChangePassword: false,
          securityQuestion: 'Qual é o primeiro nome da sua mãe?',
          securityAnswer: 'mae',
          phone: newC.phone,
          photoURL: newC.photo || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedUsers = [newSubUser, ...systemUsers];
        localStorage.setItem('cs_system_users', JSON.stringify(updatedUsers));
        firestoreUsers.save(newSubUser as any).catch(console.warn);
      }
    } catch (e) {
      console.warn('Sync subuser error:', e);
    }
  };

  const updateCaregiver = (id: string, c: Partial<Caregiver>, userName: string) => {
    setCaregivers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...c, updatedAt: new Date().toISOString() };
          firestoreCaregivers.save(updated).catch(console.warn);

          // Also sync credentials and data to system users
          if (updated.userId || updated.username) {
            try {
              const rawUsers = localStorage.getItem('cs_system_users');
              if (rawUsers) {
                const systemUsers: any[] = JSON.parse(rawUsers);
                const userIndex = systemUsers.findIndex(
                  (u) =>
                    (updated.userId && u.uid === updated.userId) ||
                    (updated.username && u.username?.toLowerCase() === updated.username.toLowerCase())
                );
                if (userIndex !== -1) {
                  systemUsers[userIndex] = {
                    ...systemUsers[userIndex],
                    displayName: `${updated.name} (${updated.relationship})`,
                    relationship: updated.relationship,
                    phone: updated.phone || systemUsers[userIndex].phone,
                    email: updated.email || systemUsers[userIndex].email,
                    password: updated.accessPassword || systemUsers[userIndex].password,
                    photoURL: updated.photo !== undefined ? updated.photo : systemUsers[userIndex].photoURL,
                    canAdministerMeds: updated.canAdministerMeds ?? systemUsers[userIndex].canAdministerMeds,
                    updatedAt: new Date().toISOString(),
                  };
                  localStorage.setItem('cs_system_users', JSON.stringify(systemUsers));
                  firestoreUsers.save(systemUsers[userIndex]).catch(console.warn);
                }
              }
            } catch (e) {
              console.warn('Sync update subuser error:', e);
            }
          }
          return updated;
        }
        return item;
      })
    );
    addHistoryLog(userName, 'alteracao', `Informações e credenciais do subcadastro atualizadas.`);
  };

  const deleteCaregiver = (id: string, userName: string) => {
    const target = caregivers.find((x) => x.id === id);
    setCaregivers((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Subcadastro de ${target.relationship} ${target.name} removido do sistema.`);
      firestoreCaregivers.delete(id).catch(console.warn);

      // Also remove login subaccount if exists
      if (target.userId || target.username) {
        try {
          const rawUsers = localStorage.getItem('cs_system_users');
          if (rawUsers) {
            const systemUsers: any[] = JSON.parse(rawUsers);
            const filtered = systemUsers.filter(
              (u) =>
                (!target.userId || u.uid !== target.userId) &&
                (!target.username || u.username?.toLowerCase() !== target.username.toLowerCase())
            );
            localStorage.setItem('cs_system_users', JSON.stringify(filtered));
            if (target.userId) {
              firestoreUsers.delete(target.userId).catch(console.warn);
            }
          }
        } catch (e) {
          console.warn('Sync delete subuser error:', e);
        }
      }
    }
  };

  const setCaregiverOnDuty = (id: string, userName: string) => {
    setCaregivers((prev) =>
      prev.map((item) => {
        const updated = {
          ...item,
          isCurrentlyOnDuty: item.id === id,
          updatedAt: new Date().toISOString(),
        };
        if (item.id === id) {
          firestoreCaregivers.save(updated).catch(console.warn);
        }
        return updated;
      })
    );
    const active = caregivers.find((x) => x.id === id);
    if (active) {
      addHistoryLog(
        userName,
        'mudanca_responsavel',
        `Responsável em plantão alterado para ${active.name} (${active.relationship}).`
      );
    }
  };

  const activeCaregiverOnDuty = caregivers.find((c) => c.isCurrentlyOnDuty);

  const addDoctor = (d: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>, userName: string) => {
    const newD: Doctor = {
      ...d,
      id: `doc_${Date.now()}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDoctors((prev) => [...prev, newD]);
    addHistoryLog(userName, 'cadastro', `Médico ${newD.name} (${newD.specialty}) cadastrado.`);
    firestoreDoctors.save(newD).catch(console.warn);
  };

  const updateDoctor = (id: string, d: Partial<Doctor>, userName: string) => {
    setDoctors((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...d, updatedAt: new Date().toISOString() };
          firestoreDoctors.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
    addHistoryLog(userName, 'alteracao', `Dados médicos atualizados.`);
  };

  const deleteDoctor = (id: string, userName: string) => {
    const target = doctors.find((x) => x.id === id);
    setDoctors((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Médico ${target.name} removido.`);
      firestoreDoctors.delete(id).catch(console.warn);
    }
  };

  const addMedication = (
    m: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newM: Medication = {
      ...m,
      id: `med_${Date.now()}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      soundAlarmEnabled: m.soundAlarmEnabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedMeds = [...medications, newM];
    setMedications(updatedMeds);
    addHistoryLog(
      userName,
      'cadastro',
      `Novo medicamento ${newM.name} (${newM.dosage}) cadastrado com horários ${newM.scheduledTimes.join(
        ', '
      )}.`
    );
    firestoreMedications.save(newM).catch(console.warn);

    // Automatically generate schedules for this new medication for today and next 60 days
    const rangeDates: string[] = [];
    const baseDate = new Date();
    for (let i = -2; i <= 60; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      rangeDates.push(d.toISOString().split('T')[0]);
    }
    regenerateSchedulesForDates(rangeDates, updatedMeds);
  };

  const updateMedication = (id: string, m: Partial<Medication>, userName: string) => {
    let oldDosage = '';
    const updatedMeds = medications.map((item) => {
      if (item.id === id) {
        oldDosage = item.dosage;
        const updated = { ...item, ...m, updatedAt: new Date().toISOString() };
        if (m.scheduledTimes && JSON.stringify(m.scheduledTimes) !== JSON.stringify(item.scheduledTimes)) {
          addHistoryLog(
            userName,
            'troca_horario',
            `Horários do medicamento ${updated.name} alterados de ${item.scheduledTimes.join(', ')} para ${m.scheduledTimes.join(', ')}.`
          );
        }
        if (m.dosage && m.dosage !== item.dosage) {
          addHistoryLog(
            userName,
            'troca_dose',
            `Dosagem do medicamento ${updated.name} alterada de "${oldDosage}" para "${m.dosage}".`
          );
        }
        firestoreMedications.save(updated).catch(console.warn);
        return updated;
      }
      return item;
    });

    setMedications(updatedMeds);

    // Update dosage and details across existing schedules in state for this medication
    const targetMed = updatedMeds.find((x) => x.id === id);
    if (targetMed) {
      setSchedules((prevSchedules) =>
        prevSchedules.map((s) => {
          if (s.medicationId === id) {
            const updatedSchedule = {
              ...s,
              medicationName: targetMed.name,
              dosage: targetMed.dosage,
              pharmaceuticalForm: targetMed.pharmaceuticalForm,
              photo: targetMed.photo,
              timingInstruction: targetMed.timingInstruction,
              isContinuous: targetMed.isContinuous || targetMed.isMedicalPrep,
              treatmentDurationDays: targetMed.treatmentDurationDays,
              soundAlarmEnabled: targetMed.soundAlarmEnabled !== false,
              updatedAt: new Date().toISOString(),
            };
            firestoreSchedules.save(updatedSchedule).catch(console.warn);
            return updatedSchedule;
          }
          return s;
        })
      );
    }

    const rangeDates: string[] = [];
    const baseDate = new Date();
    for (let i = -2; i <= 60; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      rangeDates.push(d.toISOString().split('T')[0]);
    }
    regenerateSchedulesForDates(rangeDates, updatedMeds);
  };

  const deleteMedication = (id: string, userName: string) => {
    const target = medications.find((x) => x.id === id);
    const updatedMeds = medications.filter((x) => x.id !== id);
    setMedications(updatedMeds);
    // Keep administered schedules for history and audit, remove pending/missed for deleted medication
    setSchedules((prev) => prev.filter((x) => x.medicationId !== id || x.status === 'administered'));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Medicamento ${target.name} excluído do sistema.`);
      firestoreMedications.delete(id).catch(console.warn);
    }
  };

  const addMedicalRecord = (
    r: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newR: MedicalRecord = {
      ...r,
      id: `mr_${Date.now()}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMedicalRecords((prev) => [...prev, newR]);
    addHistoryLog(
      userName,
      'cadastro',
      `Ficha médica/prescrição registrada para o médico ${newR.doctorName}.`
    );
    firestoreMedicalRecords.save(newR).catch(console.warn);
  };

  const updateMedicalRecord = (id: string, r: Partial<MedicalRecord>, userName: string) => {
    setMedicalRecords((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...r, updatedAt: new Date().toISOString() };
          firestoreMedicalRecords.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
    addHistoryLog(userName, 'alteracao', `Ficha médica atualizada.`);
  };

  const addMedicalAppointment = (
    a: Omit<MedicalAppointment, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newA: MedicalAppointment = {
      ...a,
      id: `app_${Date.now()}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMedicalAppointments((prev) => [newA, ...prev]);
    const label = newA.type === 'exame' ? 'Exame' : 'Consulta Médica';
    addHistoryLog(
      userName,
      'cadastro',
      `${label} "${newA.title}" agendado(a) para ${newA.dateTime.replace('T', ' às ')}.`
    );
    firestoreMedicalAppointments.save(newA).catch(console.warn);
  };

  const updateMedicalAppointment = (id: string, a: Partial<MedicalAppointment>, userName: string) => {
    setMedicalAppointments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...a, updatedAt: new Date().toISOString() };
          firestoreMedicalAppointments.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
    addHistoryLog(userName, 'alteracao', `Agendamento de consulta/exame atualizado.`);
  };

  const deleteMedicalAppointment = (id: string, userName: string) => {
    const target = medicalAppointments.find((x) => x.id === id);
    setMedicalAppointments((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Agendamento "${target.title}" removido.`);
      firestoreMedicalAppointments.delete(id).catch(console.warn);
    }
  };

  const confirmScheduleAdministered = (
    scheduleId: string,
    administeredBy: string,
    responsibleRole: CaregiverRelation | 'Paciente',
    notes?: string
  ) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setSchedules((prev) =>
      prev.map((item) => {
        if (item.id === scheduleId) {
          const updated: ScheduleItem = {
            ...item,
            adminId: item.adminId || currentAdminId,
            patientId: item.patientId || activePatientId,
            status: 'administered',
            administeredAt: `${item.scheduledDate} ${formattedTime}`,
            administeredBy,
            responsibleRole,
            notes: notes || item.notes,
            updatedAt: now.toISOString(),
          };

          // Audio effect
          if (settings.soundEnabled) {
            audioService.playSuccessChime();
          }

          // Decrease stock quantity by 1
          setMedications((meds) =>
            meds.map((m) => {
              if (m.id === item.medicationId) {
                const updatedMed = { ...m, stockQuantity: Math.max(0, m.stockQuantity - 1) };
                firestoreMedications.save(updatedMed).catch(console.warn);
                return updatedMed;
              }
              return m;
            })
          );

          addHistoryLog(
            administeredBy,
            'administracao',
            `Medicamento ${item.medicationName} (${item.dosage}) administrado pelo ${responsibleRole.toLowerCase()} ${administeredBy} às ${formattedTime}.`
          );

          firestoreSchedules.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  const markScheduleNotAdministered = (
    scheduleId: string,
    reason: string,
    administeredBy: string
  ) => {
    const now = new Date();
    setSchedules((prev) =>
      prev.map((item) => {
        if (item.id === scheduleId) {
          const updated: ScheduleItem = {
            ...item,
            adminId: item.adminId || currentAdminId,
            patientId: item.patientId || activePatientId,
            status: 'missed',
            reasonNotAdministered: reason,
            administeredBy,
            updatedAt: now.toISOString(),
          };

          addHistoryLog(
            administeredBy,
            'medicamento_esquecido',
            `Medicamento ${item.medicationName} das ${item.scheduledTime} não foi administrado. Motivo: ${reason}.`
          );

          firestoreSchedules.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
  };

  const regenerateSchedulesForDates = (dateStrs: string[], currentMeds?: Medication[]) => {
    const medsToUse = currentMeds || medications;
    const todayStr = getTodayString();

    setSchedules((existingSchedules) => {
      const datesSet = new Set(dateStrs);
      const otherDates = existingSchedules.filter((s) => !datesSet.has(s.scheduledDate));
      const newItems: ScheduleItem[] = [];

      dateStrs.forEach((dateStr) => {
        medsToUse.forEach((m) => {
          // Check start date constraint
          const mStart = m.startDate || '2000-01-01';
          const isToday = dateStr === todayStr;

          // All inserted medications must appear on today's agenda even if startDate was typed in the future
          // For future dates, they appear from startDate onwards
          if (dateStr < mStart && !isToday) {
            return; // Medication not started yet on dateStr
          }
          // Check end date constraint
          if (!m.isContinuous && m.endDate && dateStr > m.endDate) {
            return; // Medication treatment finished before dateStr
          }

          const times = m.scheduledTimes && m.scheduledTimes.length > 0 ? m.scheduledTimes : ['08:00'];

          times.forEach((time, idx) => {
            const existing = existingSchedules.find(
              (s) => s.scheduledDate === dateStr && s.medicationId === m.id && s.scheduledTime === time
            );
            if (existing) {
              newItems.push({
                ...existing,
                adminId: m.adminId || existing.adminId || currentAdminId,
                patientId: m.patientId || existing.patientId || activePatientId,
                medicationName: m.name,
                dosage: m.dosage,
                pharmaceuticalForm: m.pharmaceuticalForm,
                photo: m.photo,
                timingInstruction: m.timingInstruction,
                isContinuous: m.isContinuous || m.isMedicalPrep,
                treatmentDurationDays: m.treatmentDurationDays,
                startDate: m.startDate,
                endDate: m.endDate,
                soundAlarmEnabled:
                  existing.soundAlarmEnabled !== undefined
                    ? existing.soundAlarmEnabled
                    : m.soundAlarmEnabled !== false,
              });
            } else {
              newItems.push({
                id: `sch_${m.id}_${dateStr}_${idx}`,
                adminId: m.adminId || currentAdminId,
                patientId: m.patientId || activePatientId,
                medicationId: m.id,
                medicationName: m.name,
                dosage: m.dosage,
                pharmaceuticalForm: m.pharmaceuticalForm,
                photo: m.photo,
                timingInstruction: m.timingInstruction,
                scheduledDate: dateStr,
                scheduledTime: time,
                status: 'pending',
                isContinuous: m.isContinuous || m.isMedicalPrep,
                treatmentDurationDays: m.treatmentDurationDays,
                startDate: m.startDate,
                endDate: m.endDate,
                soundAlarmEnabled: m.soundAlarmEnabled !== false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          });
        });
      });

      return [...otherDates, ...newItems];
    });
  };

  const regenerateSchedulesForDate = (dateStr: string, currentMeds?: Medication[]) => {
    regenerateSchedulesForDates([dateStr], currentMeds);
  };

  const toggleScheduleSoundAlarm = (scheduleId: string, medicationId?: string) => {
    let newStatus = false;
    let targetMedId = medicationId;

    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId || (medicationId && s.medicationId === medicationId)) {
          newStatus = s.soundAlarmEnabled === false ? true : false;
          if (!targetMedId) targetMedId = s.medicationId;
          const updated = {
            ...s,
            soundAlarmEnabled: newStatus,
            updatedAt: new Date().toISOString(),
          };
          firestoreSchedules.save(updated).catch(console.warn);
          return updated;
        }
        return s;
      })
    );

    if (targetMedId) {
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id === targetMedId) {
            const updatedM = {
              ...m,
              soundAlarmEnabled: newStatus,
              updatedAt: new Date().toISOString(),
            };
            firestoreMedications.save(updatedM).catch(console.warn);
            return updatedM;
          }
          return m;
        })
      );
    }
  };

  const toggleMedicationSoundAlarm = (medicationId: string) => {
    setMedications((prev) => {
      let nextStatus = false;
      const updatedMeds = prev.map((m) => {
        if (m.id === medicationId) {
          nextStatus = m.soundAlarmEnabled === false ? true : false;
          const updated = {
            ...m,
            soundAlarmEnabled: nextStatus,
            updatedAt: new Date().toISOString(),
          };
          firestoreMedications.save(updated).catch(console.warn);
          return updated;
        }
        return m;
      });

      setSchedules((prevSchedules) =>
        prevSchedules.map((s) => {
          if (s.medicationId === medicationId) {
            const updatedS = {
              ...s,
              soundAlarmEnabled: nextStatus,
              updatedAt: new Date().toISOString(),
            };
            firestoreSchedules.save(updatedS).catch(console.warn);
            return updatedS;
          }
          return s;
        })
      );

      return updatedMeds;
    });
  };

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  };

  // Scoped Collections per active patient to guarantee data isolation & zero data leakage
  const activeMedications = useMemo(() => {
    return medications.filter(
      (m) =>
        m.patientId === activePatientId ||
        (!m.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [medications, activePatientId]);

  const activeCaregivers = useMemo(() => {
    return caregivers.filter(
      (c) =>
        c.patientId === activePatientId ||
        (!c.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [caregivers, activePatientId]);

  const activeDoctors = useMemo(() => {
    return doctors.filter(
      (d) =>
        d.patientId === activePatientId ||
        (!d.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [doctors, activePatientId]);

  const activeMedicalRecords = useMemo(() => {
    return medicalRecords.filter(
      (r) =>
        r.patientId === activePatientId ||
        (!r.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [medicalRecords, activePatientId]);

  const activeMedicalAppointments = useMemo(() => {
    return medicalAppointments.filter(
      (a) =>
        a.patientId === activePatientId ||
        (!a.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [medicalAppointments, activePatientId]);

  const activeSchedules = useMemo(() => {
    return schedules.filter(
      (s) =>
        s.patientId === activePatientId ||
        (!s.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [schedules, activePatientId]);

  const currentCaregiverOnDuty =
    activeCaregivers.find((c) => c.isCurrentlyOnDuty) || activeCaregivers[0] || caregivers[0];

  const isGeneralAdmin = currentUser?.username?.toLowerCase() === 'juliett.souza';

  // Only Juliett.Souza has access to all accounts/patients across the application.
  // Standard user profiles only receive their own assigned patient data.
  const visiblePatients = useMemo(() => {
    if (isGeneralAdmin) {
      return patients;
    }
    const myPatient = patients.filter(
      (p) =>
        p.id === activePatientId ||
        (currentUser?.patientId && p.id === currentUser.patientId) ||
        (currentUser?.uid && p.userId === currentUser.uid)
    );
    return myPatient.length > 0 ? myPatient : (patients.length > 0 ? [patients[0]] : []);
  }, [patients, isGeneralAdmin, activePatientId, currentUser?.patientId, currentUser?.uid]);

  const activeHistoryLogs = useMemo(() => {
    if (isGeneralAdmin) {
      return historyLogs;
    }
    return historyLogs.filter(
      (h) =>
        h.patientId === activePatientId ||
        (!h.patientId && (activePatientId === 'PAC-8842' || activePatientId === 'PAC-4421'))
    );
  }, [historyLogs, isGeneralAdmin, activePatientId]);

  return (
    <AppContext.Provider
      value={{
        patients: visiblePatients,
        activePatientId,
        patient: activePatient,
        selectPatientById,
        addPatient,
        updatePatient,
        deletePatient,
        perspectiveRole,
        setPerspectiveRole,
        caregivers: activeCaregivers,
        addCaregiver,
        updateCaregiver,
        deleteCaregiver,
        setCaregiverOnDuty,
        activeCaregiverOnDuty: currentCaregiverOnDuty,
        doctors: activeDoctors,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        medications: activeMedications,
        addMedication,
        updateMedication,
        deleteMedication,
        medicalRecords: activeMedicalRecords,
        addMedicalRecord,
        updateMedicalRecord,
        medicalAppointments: activeMedicalAppointments,
        addMedicalAppointment,
        updateMedicalAppointment,
        deleteMedicalAppointment,
        schedules: activeSchedules,
        confirmScheduleAdministered,
        markScheduleNotAdministered,
        regenerateSchedulesForDate,
        regenerateSchedulesForDates,
        toggleScheduleSoundAlarm,
        toggleMedicationSoundAlarm,
        historyLogs: activeHistoryLogs,
        currentView,
        setCurrentView,
        settings,
        updateSettings,
        pendingConfirmationSchedule,
        setPendingConfirmationSchedule,
        isOffline,
        isFirstSetupOpen,
        setIsFirstSetupOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
