import React, { createContext, useContext, useState, useEffect } from 'react';
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
    name: 'Enfermeiro Pedro Ramos',
    relationship: 'Enfermeiro(a)',
    phone: '(11) 96666-3333',
    email: 'pedro.enfermeiro@gmail.com',
    isCurrentlyOnDuty: false,
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
        medicationId: m.id,
        medicationName: m.name,
        dosage: m.dosage,
        pharmaceuticalForm: m.pharmaceuticalForm,
        photo: m.photo,
        timingInstruction: m.timingInstruction,
        scheduledDate: today,
        scheduledTime: time,
        status,
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
          setPatients(remotePatients);
          if (!remotePatients.some((p) => p.id === activePatientId)) {
            setActivePatientId(remotePatients[0].id);
          }
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
    const found = patients.find((p) => p.id === id);
    if (found) {
      setActivePatientId(id);
      addHistoryLog('Administrador', 'alteracao', `Visualização alternada para o paciente ID: ${id} (${found.fullName}).`);
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
    const newC: Caregiver = {
      ...c,
      id: `cg_${Date.now()}`,
      adminId: currentAdminId,
      patientId: activePatientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCaregivers((prev) => [...prev, newC]);
    addHistoryLog(
      userName,
      'cadastro',
      `Novo responsável ${newC.name} (${newC.relationship}) cadastrado.`
    );
    firestoreCaregivers.save(newC).catch(console.warn);
  };

  const updateCaregiver = (id: string, c: Partial<Caregiver>, userName: string) => {
    setCaregivers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...c, updatedAt: new Date().toISOString() };
          firestoreCaregivers.save(updated).catch(console.warn);
          return updated;
        }
        return item;
      })
    );
    addHistoryLog(userName, 'alteracao', `Informações do responsável atualizadas.`);
  };

  const deleteCaregiver = (id: string, userName: string) => {
    const target = caregivers.find((x) => x.id === id);
    setCaregivers((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Responsável ${target.name} removido do sistema.`);
      firestoreCaregivers.delete(id).catch(console.warn);
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
    // Automatically generate today's schedule for this new medication using the latest list
    regenerateSchedulesForDate(getTodayString(), updatedMeds);
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
              updatedAt: new Date().toISOString(),
            };
            firestoreSchedules.save(updatedSchedule).catch(console.warn);
            return updatedSchedule;
          }
          return s;
        })
      );
    }

    regenerateSchedulesForDate(getTodayString(), updatedMeds);
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
    setSchedules((existingSchedules) => {
      const datesSet = new Set(dateStrs);
      const otherDates = existingSchedules.filter((s) => !datesSet.has(s.scheduledDate));
      const newItems: ScheduleItem[] = [];

      dateStrs.forEach((dateStr) => {
        medsToUse.forEach((m) => {
          // Check start date constraint
          const mStart = m.startDate || '2000-01-01';
          if (dateStr < mStart) {
            return; // Medication not started yet on dateStr
          }
          // Check end date constraint
          if (!m.isContinuous && m.endDate && dateStr > m.endDate) {
            return; // Medication treatment finished before dateStr
          }

          m.scheduledTimes.forEach((time, idx) => {
            const existing = existingSchedules.find(
              (s) => s.scheduledDate === dateStr && s.medicationId === m.id && s.scheduledTime === time
            );
            if (existing) {
              newItems.push({
                ...existing,
                medicationName: m.name,
                dosage: m.dosage,
                pharmaceuticalForm: m.pharmaceuticalForm,
                photo: m.photo,
                timingInstruction: m.timingInstruction,
              });
            } else {
              newItems.push({
                id: `sch_${m.id}_${dateStr}_${idx}`,
                medicationId: m.id,
                medicationName: m.name,
                dosage: m.dosage,
                pharmaceuticalForm: m.pharmaceuticalForm,
                photo: m.photo,
                timingInstruction: m.timingInstruction,
                scheduledDate: dateStr,
                scheduledTime: time,
                status: 'pending',
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

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        activePatientId,
        patient: activePatient,
        selectPatientById,
        addPatient,
        updatePatient,
        deletePatient,
        perspectiveRole,
        setPerspectiveRole,
        caregivers,
        addCaregiver,
        updateCaregiver,
        deleteCaregiver,
        setCaregiverOnDuty,
        activeCaregiverOnDuty,
        doctors,
        addDoctor,
        updateDoctor,
        deleteDoctor,
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        medicalRecords,
        addMedicalRecord,
        updateMedicalRecord,
        medicalAppointments,
        addMedicalAppointment,
        updateMedicalAppointment,
        deleteMedicalAppointment,
        schedules,
        confirmScheduleAdministered,
        markScheduleNotAdministered,
        regenerateSchedulesForDate,
        regenerateSchedulesForDates,
        historyLogs,
        currentView,
        setCurrentView,
        settings,
        updateSettings,
        pendingConfirmationSchedule,
        setPendingConfirmationSchedule,
        isOffline,
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
