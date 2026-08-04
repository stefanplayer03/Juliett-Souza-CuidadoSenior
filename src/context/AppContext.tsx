import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Patient,
  Caregiver,
  Doctor,
  Medication,
  MedicalRecord,
  ScheduleItem,
  HistoryLog,
  AppSettings,
  ActionType,
  CaregiverRelation,
  ScheduleStatus,
} from '../types';
import { audioService } from '../services/audio';

interface AppContextType {
  patient: Patient;
  updatePatient: (data: Partial<Patient>, userName: string) => void;

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

const DEFAULT_PATIENT: Patient = {
  id: 'patient_1',
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
  notes: 'Necessita de acompanhamento para ingestion de líquidos pela manhã.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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
    relationship: 'Enfermeiro',
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
  const [patient, setPatient] = useState<Patient>(() => {
    const s = localStorage.getItem('cs_patient');
    return s ? JSON.parse(s) : DEFAULT_PATIENT;
  });

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
    localStorage.setItem('cs_patient', JSON.stringify(patient));
    localStorage.setItem('cs_caregivers', JSON.stringify(caregivers));
    localStorage.setItem('cs_doctors', JSON.stringify(doctors));
    localStorage.setItem('cs_medications', JSON.stringify(medications));
    localStorage.setItem('cs_medical_records', JSON.stringify(medicalRecords));
    localStorage.setItem('cs_schedules', JSON.stringify(schedules));
    localStorage.setItem('cs_history', JSON.stringify(historyLogs));
    localStorage.setItem('cs_settings', JSON.stringify(settings));
  }, [patient, caregivers, doctors, medications, medicalRecords, schedules, historyLogs, settings]);

  const addHistoryLog = (userName: string, actionType: ActionType, description: string) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now
      .toTimeString()
      .split(' ')[0]}`;
    const newLog: HistoryLog = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formattedDate,
      userName,
      actionType,
      description,
      createdAt: now.toISOString(),
    };
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  const updatePatient = (data: Partial<Patient>, userName: string) => {
    setPatient((prev) => {
      const updated = { ...prev, ...data, updatedAt: new Date().toISOString() };
      addHistoryLog(userName, 'alteracao', `Perfil da paciente ${updated.fullName} atualizado.`);
      return updated;
    });
  };

  const addCaregiver = (
    c: Omit<Caregiver, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newC: Caregiver = {
      ...c,
      id: `cg_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCaregivers((prev) => [...prev, newC]);
    addHistoryLog(
      userName,
      'cadastro',
      `Novo responsável ${newC.name} (${newC.relationship}) cadastrado.`
    );
  };

  const updateCaregiver = (id: string, c: Partial<Caregiver>, userName: string) => {
    setCaregivers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...c, updatedAt: new Date().toISOString() } : item))
    );
    addHistoryLog(userName, 'alteracao', `Informações do responsável atualizadas.`);
  };

  const deleteCaregiver = (id: string, userName: string) => {
    const target = caregivers.find((x) => x.id === id);
    setCaregivers((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Responsável ${target.name} removido do sistema.`);
    }
  };

  const setCaregiverOnDuty = (id: string, userName: string) => {
    setCaregivers((prev) =>
      prev.map((item) => ({
        ...item,
        isCurrentlyOnDuty: item.id === id,
        updatedAt: new Date().toISOString(),
      }))
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDoctors((prev) => [...prev, newD]);
    addHistoryLog(userName, 'cadastro', `Médico ${newD.name} (${newD.specialty}) cadastrado.`);
  };

  const updateDoctor = (id: string, d: Partial<Doctor>, userName: string) => {
    setDoctors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...d, updatedAt: new Date().toISOString() } : item))
    );
    addHistoryLog(userName, 'alteracao', `Dados médicos atualizados.`);
  };

  const deleteDoctor = (id: string, userName: string) => {
    const target = doctors.find((x) => x.id === id);
    setDoctors((prev) => prev.filter((x) => x.id !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Médico ${target.name} removido.`);
    }
  };

  const addMedication = (
    m: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newM: Medication = {
      ...m,
      id: `med_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMedications((prev) => [...prev, newM]);
    addHistoryLog(
      userName,
      'cadastro',
      `Novo medicamento ${newM.name} (${newM.dosage}) cadastrado com horários ${newM.scheduledTimes.join(
        ', '
      )}.`
    );
    // Automatically generate today's schedule for this new medication
    regenerateSchedulesForDate(getTodayString());
  };

  const updateMedication = (id: string, m: Partial<Medication>, userName: string) => {
    setMedications((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...m, updatedAt: new Date().toISOString() };
          if (m.scheduledTimes) {
            addHistoryLog(
              userName,
              'troca_horario',
              `Horários do medicamento ${updated.name} alterados para ${m.scheduledTimes.join(
                ', '
              )}.`
            );
          }
          if (m.dosage) {
            addHistoryLog(
              userName,
              'troca_dose',
              `Dosagem do medicamento ${updated.name} alterada para ${m.dosage}.`
            );
          }
          return updated;
        }
        return item;
      })
    );
    regenerateSchedulesForDate(getTodayString());
  };

  const deleteMedication = (id: string, userName: string) => {
    const target = medications.find((x) => x.id === id);
    setMedications((prev) => prev.filter((x) => x.id !== id));
    setSchedules((prev) => prev.filter((x) => x.medicationId !== id));
    if (target) {
      addHistoryLog(userName, 'exclusao', `Medicamento ${target.name} excluído do sistema.`);
    }
  };

  const addMedicalRecord = (
    r: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>,
    userName: string
  ) => {
    const newR: MedicalRecord = {
      ...r,
      id: `mr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMedicalRecords((prev) => [...prev, newR]);
    addHistoryLog(
      userName,
      'cadastro',
      `Ficha médica/prescrição registrada para o médico ${newR.doctorName}.`
    );
  };

  const updateMedicalRecord = (id: string, r: Partial<MedicalRecord>, userName: string) => {
    setMedicalRecords((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...r, updatedAt: new Date().toISOString() } : item))
    );
    addHistoryLog(userName, 'alteracao', `Ficha médica atualizada.`);
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
            meds.map((m) =>
              m.id === item.medicationId
                ? { ...m, stockQuantity: Math.max(0, m.stockQuantity - 1) }
                : m
            )
          );

          addHistoryLog(
            administeredBy,
            'administracao',
            `Medicamento ${item.medicationName} (${item.dosage}) administrado pelo ${responsibleRole.toLowerCase()} ${administeredBy} às ${formattedTime}.`
          );

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

          return updated;
        }
        return item;
      })
    );
  };

  const regenerateSchedulesForDate = (dateStr: string) => {
    setSchedules((existingSchedules) => {
      const otherDates = existingSchedules.filter((s) => s.scheduledDate !== dateStr);
      const newItems: ScheduleItem[] = [];

      medications.forEach((m) => {
        m.scheduledTimes.forEach((time, idx) => {
          const existing = existingSchedules.find(
            (s) => s.scheduledDate === dateStr && s.medicationId === m.id && s.scheduledTime === time
          );
          if (existing) {
            newItems.push(existing);
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

      return [...otherDates, ...newItems];
    });
  };

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  };

  return (
    <AppContext.Provider
      value={{
        patient,
        updatePatient,
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
        schedules,
        confirmScheduleAdministered,
        markScheduleNotAdministered,
        regenerateSchedulesForDate,
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
