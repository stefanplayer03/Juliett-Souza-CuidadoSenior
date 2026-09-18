export type UserRole = 'superadmin' | 'admin' | 'user' | 'paciente' | 'responsavel' | 'cuidador';

export interface UserProfile {
  uid: string;
  adminId?: string; // ID do Administrador Clínico responsável (se houver)
  patientId?: string; // ID do Paciente vinculado (para subcadastros de responsáveis, cuidadores e familiares)
  isSubAccount?: boolean; // Verdadeiro se for um subcadastro criado dentro do perfil do paciente principal
  isPrimaryPatientAccount?: boolean; // Verdadeiro se for o cadastro titular do paciente
  relationship?: string; // e.g. "Filha", "Cuidador", "Esposa", "Responsável"
  canAdministerMeds?: boolean; // Permissão para confirmar doses de medicamentos
  canEditData?: boolean; // Permissão para alterar cadastros
  username: string; // e.g. "Juliett.Souza" ou "maria.filha"
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  password?: string;
  mustChangePassword?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
  isActive?: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export const SECURITY_QUESTIONS = [
  'Qual é o nome do seu primeiro animal de estimação?',
  'Qual é a cidade em que você nasceu?',
  'Qual é o primeiro nome da sua mãe?',
  'Qual foi o modelo do seu primeiro carro?',
  'Qual é o nome da sua escola primária?',
  'Qual é o seu prato ou comida favorita da infância?',
  'Qual é o nome do seu melhor amigo de infância?',
];

export interface Patient {
  id: string;
  userId?: string; // ID do usuário associado à conta do paciente (Cadastro Principal)
  adminId?: string; // ID do Administrador Clínico ao qual o paciente está atrelado
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
  isFirstSetupCompleted?: boolean; // Se o paciente já finalizou o primeiro cadastro de responsáveis, ficha e medicamentos
  createdAt: string;
  updatedAt: string;
}

export type CaregiverRelation =
  | 'Cuidador'
  | 'Filha'
  | 'Filho'
  | 'Responsável'
  | 'Curador'
  | 'Enfermeiro(a)'
  | 'Esposa'
  | 'Marido'
  | 'Outro';

export interface Caregiver {
  id: string;
  adminId?: string; // ID do Administrador Clínico responsável
  patientId?: string; // ID do Paciente vinculado (Cadastro Principal)
  userId?: string; // ID da conta de usuário de acesso
  username?: string; // Login de acesso individual do responsável (ex: maria.filha)
  accessPassword?: string; // Senha de acesso individual configurada
  canAdministerMeds?: boolean; // Pode dar baixa em remédios
  canEditData?: boolean;
  name: string;
  relationship: CaregiverRelation;
  phone: string;
  email: string;
  cpf?: string;
  shiftHours?: string;
  notes?: string;
  isCurrentlyOnDuty: boolean;
  receiveNotifications: boolean;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  adminId?: string; // ID do Administrador Clínico responsável
  patientId?: string; // ID do Paciente vinculado
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
  adminId?: string;
  patientId?: string;
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
  isMedicalPrep?: boolean;
  soundAlarmEnabled?: boolean;
  timingInstruction: TimingInstruction;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  adminId?: string;
  patientId?: string;
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

export type AppointmentType = 'consulta' | 'exame';

export interface MedicalAppointment {
  id: string;
  adminId?: string;
  patientId?: string;
  type: AppointmentType;
  title: string;
  specialtyOrExam: string;
  doctorOrClinic: string;
  addressOrLocation?: string;
  dateTime: string; // ISO string YYYY-MM-DDTHH:mm
  prepInstructions?: string; // Preparo de exame: ex: Jejum 12h
  status: 'agendado' | 'concluido' | 'cancelado';
  attachmentUrl?: string; // Anexo em PDF ou Foto
  attachmentName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'pending' | 'administered' | 'delayed' | 'missed';

export interface ScheduleItem {
  id: string;
  adminId?: string;
  patientId?: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  pharmaceuticalForm: PharmaceuticalForm;
  photo: string;
  timingInstruction: TimingInstruction;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: ScheduleStatus;
  isContinuous?: boolean;
  treatmentDurationDays?: number;
  startDate?: string;
  endDate?: string;
  soundAlarmEnabled?: boolean;
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
  adminId?: string;
  patientId?: string;
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
