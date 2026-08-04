export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  emergencyPhone: string;
  address: string;
  photo: string;
  bloodType: string;
  weight: number;
  height: number;
  allergies: string[];
  diseases: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CaregiverRelation =
  | 'Filho'
  | 'Filha'
  | 'Esposa'
  | 'Marido'
  | 'Cuidador'
  | 'Curador'
  | 'Enfermeiro'
  | 'Outro';

export interface Caregiver {
  id: string;
  name: string;
  relationship: CaregiverRelation;
  phone: string;
  email: string;
  isCurrentlyOnDuty: boolean;
  receiveNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  phone: string;
  clinic: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PharmaceuticalForm =
  | 'Comprimido'
  | 'Gotas'
  | 'Pomada'
  | 'Injeção'
  | 'Cápsula'
  | 'Xarope';

export type TimingInstruction =
  | 'Antes da refeição'
  | 'Depois da refeição'
  | 'Em jejum'
  | 'Durante a refeição'
  | 'Indiferente';

export interface Medication {
  id: string;
  name: string;
  photo: string;
  dosage: string;
  pharmaceuticalForm: PharmaceuticalForm;
  stockQuantity: number;
  scheduledTimes: string[]; // e.g. ["08:00", "20:00"]
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  startDate: string;
  endDate?: string;
  treatmentDurationDays?: number;
  isContinuous: boolean;
  timingInstruction: TimingInstruction;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  medicationId?: string;
  reason: string;
  symptoms: string;
  diagnosis: string;
  cid?: string;
  doctorName: string;
  crm: string;
  consultationDate: string;
  prescriptionDate: string;
  notes: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'pending' | 'administered' | 'delayed' | 'missed';

export interface ScheduleItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  pharmaceuticalForm: PharmaceuticalForm;
  photo: string;
  timingInstruction: TimingInstruction;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: ScheduleStatus;
  administeredAt?: string; // ISO string or HH:mm
  administeredBy?: string;
  responsibleRole?: CaregiverRelation | 'Paciente';
  reasonNotAdministered?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActionType =
  | 'cadastro'
  | 'alteracao'
  | 'exclusao'
  | 'troca_horario'
  | 'troca_dose'
  | 'mudanca_responsavel'
  | 'administracao'
  | 'medicamento_esquecido';

export interface HistoryLog {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  userName: string;
  actionType: ActionType;
  description: string;
  createdAt: string;
}

export interface AppSettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  soundEnabled: boolean;
  ttsEnabled: boolean;
  highContrast: boolean;
  autoEscalateMinutes: number;
}
