import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { firestoreUsers } from '../firebase/db';
import { UserProfile, UserRole, SECURITY_QUESTIONS } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  usersList: UserProfile[];
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }>;
  completeFirstSetup: (newPassword: string, securityQuestion: string, securityAnswer: string) => Promise<{ success: boolean; error?: string }>;
  getSecurityQuestionForUser: (identifier: string) => string | null;
  recoverPasswordWithQuestion: (identifier: string, answer: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  createOrUpdateSubUserForPatient: (
    patientId: string,
    data: {
      userId?: string;
      name: string;
      relationship: string;
      username: string;
      password?: string;
      email?: string;
      phone?: string;
      canAdministerMeds?: boolean;
    }
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  deleteSubUserForPatient: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (uid: string, data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (uid: string) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (uid: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPasswordByAdmin: (uid: string, tempPass: string, forceChange: boolean) => Promise<{ success: boolean; error?: string }>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial Super Admin & Demo System Users with explicit Patient Principals and Subcadastros
const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    uid: 'user_superadmin_juliett',
    username: 'Juliett.Souza',
    email: 'juliett.souza@cuidadosenior.app',
    displayName: 'Juliett Souza (Administradora Geral)',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    role: 'superadmin',
    password: 'F@milia26',
    mustChangePassword: true, // Solicita troca de senha e cadastro de pergunta no primeiro acesso
    securityQuestion: 'Qual é o nome do seu primeiro animal de estimação?',
    securityAnswer: 'max',
    isActive: true,
    phone: '(11) 98888-9999',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: undefined,
  },
  {
    uid: 'user_dra_ana',
    patientId: 'PAC-8842',
    isSubAccount: true,
    relationship: 'Médica Assistente',
    username: 'dra.ana',
    email: 'dra.ana@cuidadosenior.app',
    displayName: 'Dra. Ana Costa (Médica Assistente)',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    role: 'user',
    password: 'Medico2026',
    mustChangePassword: false,
    securityQuestion: 'Qual é o primeiro nome da sua mãe?',
    securityAnswer: 'helena',
    isActive: true,
    phone: '(11) 3333-4444',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_paciente_francisca',
    patientId: 'PAC-8842',
    isSubAccount: false,
    isPrimaryPatientAccount: true,
    username: 'dona.francisca',
    email: 'francisca.alves@cuidadosenior.app',
    displayName: 'Dona Francisca Alves de Souza (Paciente Principal)',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'paciente',
    password: 'Francisca2026',
    mustChangePassword: false,
    securityQuestion: 'Qual é a cidade em que você nasceu?',
    securityAnswer: 'campinas',
    isActive: true,
    phone: '(11) 98765-4321',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_paciente_alzira',
    patientId: 'PAC-4421',
    isSubAccount: false,
    isPrimaryPatientAccount: true,
    username: 'dona.alzira',
    email: 'alzira.oliveira@cuidadosenior.app',
    displayName: 'Dona Alzira Maria de Oliveira (Paciente Principal)',
    photoURL: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
    role: 'paciente',
    password: 'Alzira2026',
    mustChangePassword: false,
    securityQuestion: 'Qual é o primeiro nome da sua mãe?',
    securityAnswer: 'maria',
    isActive: true,
    phone: '(11) 96666-5555',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_irani_cuidadora',
    patientId: 'PAC-4421', // Subcadastro vinculado à paciente Dona Alzira
    isSubAccount: true,
    relationship: 'Cuidadora',
    canAdministerMeds: true,
    canEditData: true,
    adminId: 'user_admin_dra_ana',
    username: 'irani.cuidadora',
    email: 'irani.simoes@cuidadosenior.app',
    displayName: 'Irani Simões (Cuidadora - Dona Alzira)',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    role: 'cuidador',
    password: 'Irani2026',
    mustChangePassword: false,
    securityQuestion: 'Qual é a cidade em que você nasceu?',
    securityAnswer: 'santos',
    isActive: true,
    phone: '(11) 95555-4444',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_familiar_maria',
    patientId: 'PAC-8842', // Subcadastro vinculado à paciente Dona Francisca
    isSubAccount: true,
    relationship: 'Filha',
    canAdministerMeds: true,
    canEditData: true,
    adminId: 'user_admin_dra_ana',
    username: 'maria.filha',
    email: 'maria.santos@cuidadosenior.app',
    displayName: 'Maria Santos Alves (Filha Responsável - Dona Francisca)',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'responsavel',
    password: 'Familia2026',
    mustChangePassword: false,
    securityQuestion: 'Qual foi o modelo do seu primeiro carro?',
    securityAnswer: 'gol',
    isActive: true,
    phone: '(11) 97777-2222',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_cuidador_joao',
    patientId: 'PAC-8842', // Subcadastro vinculado à paciente Dona Francisca
    isSubAccount: true,
    relationship: 'Cuidador',
    canAdministerMeds: true,
    canEditData: true,
    adminId: 'user_admin_dra_ana',
    username: 'joao.cuidador',
    email: 'joao.cuidador@cuidadosenior.app',
    displayName: 'João Oliveira (Cuidador de Plantão - Dona Francisca)',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'cuidador',
    password: 'Cuidador123',
    mustChangePassword: false,
    securityQuestion: 'Qual é a cidade em que você nasceu?',
    securityAnswer: 'sao paulo',
    isActive: true,
    phone: '(11) 98888-1111',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load registered users list from localStorage and merge default initial accounts
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('cs_system_users');
    if (!saved) {
      localStorage.setItem('cs_system_users', JSON.stringify(INITIAL_SYSTEM_USERS));
      return INITIAL_SYSTEM_USERS;
    }
    try {
      const parsed: UserProfile[] = JSON.parse(saved);
      let updated = [...parsed];
      let changed = false;
      INITIAL_SYSTEM_USERS.forEach((initialUser) => {
        const foundIndex = updated.findIndex(
          (u) => u.username.toLowerCase() === initialUser.username.toLowerCase()
        );
        if (foundIndex === -1) {
          updated.push(initialUser);
          changed = true;
        } else {
          // Keep patientId and relationship synchronized
          if (initialUser.patientId && !updated[foundIndex].patientId) {
            updated[foundIndex] = {
              ...updated[foundIndex],
              patientId: initialUser.patientId,
              isSubAccount: initialUser.isSubAccount,
              relationship: initialUser.relationship,
            };
            changed = true;
          }
        }
      });
      // Enforce: ONLY Juliett.Souza has superadmin/admin. All other accounts must have user/paciente role.
      updated = updated.map((u) => {
        if (u.username.toLowerCase() === 'juliett.souza') {
          if (u.role !== 'superadmin') {
            changed = true;
            return { ...u, role: 'superadmin' as UserRole, displayName: 'Juliett Souza (Administradora Geral)' };
          }
          return u;
        } else {
          if (u.role === 'superadmin' || u.role === 'admin') {
            changed = true;
            return { ...u, role: 'user' as UserRole };
          }
          return u;
        }
      });

      if (changed) {
        localStorage.setItem('cs_system_users', JSON.stringify(updated));
      }
      return updated;
    } catch {
      localStorage.setItem('cs_system_users', JSON.stringify(INITIAL_SYSTEM_USERS));
      return INITIAL_SYSTEM_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cs_user');
    if (saved) {
      try {
        const u: UserProfile = JSON.parse(saved);
        if (u?.mustChangePassword) {
          localStorage.removeItem('cs_user');
          return null;
        }
        // Enforce rule: ONLY Juliett.Souza can be superadmin/admin. Other accounts must have user role.
        if (u.username?.toLowerCase() !== 'juliett.souza' && (u.role === 'superadmin' || u.role === 'admin')) {
          const sanitized = { ...u, role: 'user' as UserRole };
          localStorage.setItem('cs_user', JSON.stringify(sanitized));
          return sanitized;
        }
        return u;
      } catch {
        return null;
      }
    }
    return null; // Show SaaS Login screen by default when not logged in
  });

  const [loading, setLoading] = useState(false);

  // Sync users from Firestore on boot
  useEffect(() => {
    let isMounted = true;
    firestoreUsers.getAll().then((remoteUsers) => {
      if (isMounted && remoteUsers && remoteUsers.length > 0) {
        setUsersList((prev) => {
          const map = new Map<string, UserProfile>();
          INITIAL_SYSTEM_USERS.forEach((u) => map.set(u.uid, u));
          prev.forEach((u) => map.set(u.uid, u));
          remoteUsers.forEach((u) => map.set(u.uid, u));
          return Array.from(map.values());
        });
      }
    }).catch((err) => console.warn('Firestore users init notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync usersList to localStorage
  useEffect(() => {
    localStorage.setItem('cs_system_users', JSON.stringify(usersList));
  }, [usersList]);

  // Sync currentUser to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cs_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cs_user');
    }
  }, [currentUser]);

  // Firebase auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const isSuperAdminEmail = fbUser.email?.toLowerCase().includes('juliettsouza') || fbUser.email?.toLowerCase().includes('juliett');
        const existingInList = usersList.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase());

        const user: UserProfile = {
          uid: fbUser.uid,
          adminId: existingInList?.adminId || (isSuperAdminEmail ? undefined : fbUser.uid),
          username: existingInList?.username || fbUser.email?.split('@')[0] || 'usuario',
          email: fbUser.email || 'usuario@cuidadosenior.app',
          displayName: fbUser.displayName || existingInList?.displayName || (isSuperAdminEmail ? 'Juliett Souza (Super Admin)' : 'Usuário Conectado'),
          photoURL: fbUser.photoURL || existingInList?.photoURL || undefined,
          role: isSuperAdminEmail ? 'superadmin' : (existingInList?.role || 'admin'),
          isActive: true,
          mustChangePassword: existingInList?.mustChangePassword || false,
          securityQuestion: existingInList?.securityQuestion,
          securityAnswer: existingInList?.securityAnswer,
          createdAt: existingInList?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setCurrentUser(user);
        firestoreUsers.save(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usersList]);

  /**
   * Primary SaaS Login handler (by Username or Email + Password)
   */
  const loginWithCredentials = async (identifier: string, pass: string): Promise<{ success: boolean; mustChangePassword?: boolean; error?: string }> => {
    setLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check against usersList
    const targetUser = usersList.find(
      (u) => u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId
    );

    if (!targetUser) {
      setLoading(false);
      return { success: false, error: 'Usuário ou e-mail não encontrado no sistema.' };
    }

    if (targetUser.isActive === false) {
      setLoading(false);
      return { success: false, error: 'Esta conta de usuário foi desativada pelo Super Administrador.' };
    }

    // Special validation for Super Admin Juliett.Souza
    const isJuliett = targetUser.username.toLowerCase() === 'juliett.souza';
    const isValidPass = targetUser.password === cleanPass || (isJuliett && cleanPass === 'F@milia26');

    if (!isValidPass) {
      setLoading(false);
      return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
    }

    const now = new Date().toISOString();
    const updatedUser: UserProfile = {
      ...targetUser,
      lastLoginAt: now,
      updatedAt: now,
    };

    // Update in usersList and Firestore
    setUsersList((prev) => prev.map((u) => (u.uid === targetUser.uid ? updatedUser : u)));
    setCurrentUser(updatedUser);
    firestoreUsers.save(updatedUser);
    setLoading(false);

    return { 
      success: true, 
      mustChangePassword: !!updatedUser.mustChangePassword 
    };
  };

  /**
   * Complete First Access Setup (Troca Obrigatória de Senha + Pergunta de Segurança)
   */
  const completeFirstSetup = async (
    newPassword: string, 
    securityQuestion: string, 
    securityAnswer: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Nenhum usuário autenticado para configurar.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }

    if (!securityQuestion || !securityAnswer || !securityAnswer.trim()) {
      return { success: false, error: 'Por favor, selecione uma pergunta e preencha a resposta de segurança.' };
    }

    const now = new Date().toISOString();
    const updatedUser: UserProfile = {
      ...currentUser,
      password: newPassword,
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim().toLowerCase(),
      mustChangePassword: false,
      updatedAt: now,
    };

    setCurrentUser(updatedUser);
    setUsersList((prev) => prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)));
    firestoreUsers.save(updatedUser);

    return { success: true };
  };

  /**
   * Get registered security question for password recovery
   */
  const getSecurityQuestionForUser = (identifier: string): string | null => {
    const clean = identifier.trim().toLowerCase();
    const user = usersList.find(
      (u) => u.username?.toLowerCase() === clean || u.email?.toLowerCase() === clean
    );
    if (user && user.securityQuestion) {
      return user.securityQuestion;
    }
    return null;
  };

  /**
   * Recover password using Security Question Answer
   */
  const recoverPasswordWithQuestion = async (
    identifier: string,
    answer: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanId = identifier.trim().toLowerCase();
    const cleanAnswer = answer.trim().toLowerCase();

    const user = usersList.find(
      (u) => u.username?.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId
    );

    if (!user) {
      setLoading(false);
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (!user.securityAnswer) {
      setLoading(false);
      return { success: false, error: 'Este usuário não possui pergunta de recuperação cadastrada. Contate o Super Admin.' };
    }

    if (user.securityAnswer.trim().toLowerCase() !== cleanAnswer) {
      setLoading(false);
      return { success: false, error: 'Resposta de segurança incorreta. Tente novamente.' };
    }

    if (!newPassword || newPassword.length < 6) {
      setLoading(false);
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const now = new Date().toISOString();
    const updatedUser: UserProfile = {
      ...user,
      password: newPassword,
      mustChangePassword: false,
      updatedAt: now,
    };

    setUsersList((prev) => prev.map((u) => (u.uid === user.uid ? updatedUser : u)));
    setCurrentUser(updatedUser);
    firestoreUsers.save(updatedUser);
    setLoading(false);

    return { success: true };
  };

  /**
   * Super Admin & Clinical Admin: Register a new user
   * Defaults to 'admin' (Administrador Clínico) for self-registration,
   * or links adminId if registered by an existing Clinical Admin.
   */
  const registerUser = async (
    userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const cleanUsername = userData.username.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate
    const exists = usersList.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );

    if (exists) {
      return { success: false, error: 'Já existe um usuário com este Nome de Usuário ou E-mail.' };
    }

    // STRICT ROLE CONTROL:
    // O UNICO PERFIL COM ADMINISTRADOR GERAL É O JULIETT.SOUZA.
    // Todas as demais contas precisam ter perfil usuário/paciente.
    const isJuliett = cleanUsername.toLowerCase() === 'juliett.souza';
    let assignedRole: UserRole = 'user';
    if (isJuliett) {
      assignedRole = 'superadmin';
    } else if (userData.role && ['user', 'paciente', 'cuidador', 'responsavel'].includes(userData.role)) {
      assignedRole = userData.role;
    } else {
      assignedRole = 'user';
    }

    const now = new Date().toISOString();
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newUser: UserProfile = {
      ...userData,
      uid,
      adminId: 'user_superadmin_juliett',
      username: cleanUsername,
      email: cleanEmail,
      role: assignedRole,
      isActive: userData.isActive ?? true,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : false,
      securityAnswer: userData.securityAnswer ? userData.securityAnswer.trim().toLowerCase() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    setUsersList((prev) => [newUser, ...prev]);
    firestoreUsers.save(newUser);
    return { success: true, user: newUser };
  };

  /**
   * Create or update a sub-account (Responsável, Cuidador, Parente)
   * explicitly linked to a primary Patient's profile
   */
  const createOrUpdateSubUserForPatient = async (
    patientId: string,
    data: {
      userId?: string;
      name: string;
      relationship: string;
      username: string;
      password?: string;
      email?: string;
      phone?: string;
      canAdministerMeds?: boolean;
    }
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const cleanUsername = data.username.trim();
    const cleanEmail = (data.email && data.email.trim())
      ? data.email.trim().toLowerCase()
      : `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@cuidadosenior.app`;

    // 1. If existing userId is provided or match by userId
    if (data.userId) {
      const existing = usersList.find((u) => u.uid === data.userId);
      if (existing) {
        const updated: UserProfile = {
          ...existing,
          displayName: `${data.name.trim()} (${data.relationship})`,
          username: cleanUsername,
          email: cleanEmail,
          phone: data.phone || existing.phone,
          relationship: data.relationship,
          canAdministerMeds: data.canAdministerMeds ?? true,
          password: data.password ? data.password.trim() : existing.password,
          patientId,
          isSubAccount: true,
          role: data.relationship === 'Cuidador' || data.relationship === 'Enfermeiro(a)' ? 'cuidador' : 'responsavel',
          updatedAt: new Date().toISOString(),
        };
        setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
        firestoreUsers.save(updated);
        return { success: true, user: updated };
      }
    }

    // 2. Check duplicate username for a different account
    const usernameTaken = usersList.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.uid !== data.userId
    );
    if (usernameTaken) {
      // If it exists and is already this patient's subuser, update it
      const existingSub = usersList.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.patientId === patientId
      );
      if (existingSub) {
        const updated: UserProfile = {
          ...existingSub,
          displayName: `${data.name.trim()} (${data.relationship})`,
          relationship: data.relationship,
          canAdministerMeds: data.canAdministerMeds ?? true,
          password: data.password ? data.password.trim() : existingSub.password,
          phone: data.phone || existingSub.phone,
          updatedAt: new Date().toISOString(),
        };
        setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
        firestoreUsers.save(updated);
        return { success: true, user: updated };
      }

      return {
        success: false,
        error: `O login de usuário "${cleanUsername}" já está em uso por outro membro do sistema. Escolha outro.`,
      };
    }

    // 3. Create fresh sub-account
    const now = new Date().toISOString();
    const uid = data.userId || `user_sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const role: UserRole =
      data.relationship === 'Cuidador' || data.relationship === 'Enfermeiro(a)'
        ? 'cuidador'
        : 'responsavel';

    const newSubUser: UserProfile = {
      uid,
      patientId,
      isSubAccount: true,
      relationship: data.relationship,
      canAdministerMeds: data.canAdministerMeds ?? true,
      canEditData: true,
      displayName: `${data.name.trim()} (${data.relationship})`,
      username: cleanUsername,
      email: cleanEmail,
      role,
      password: data.password ? data.password.trim() : 'Familia2026',
      isActive: true,
      mustChangePassword: false,
      securityQuestion: 'Qual é o primeiro nome da sua mãe?',
      securityAnswer: 'mae',
      phone: data.phone,
      createdAt: now,
      updatedAt: now,
    };

    setUsersList((prev) => [newSubUser, ...prev]);
    firestoreUsers.save(newSubUser);
    return { success: true, user: newSubUser };
  };

  /**
   * Delete or deactivate a sub-user when caregiver is removed
   */
  const deleteSubUserForPatient = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    setUsersList((prev) => prev.filter((u) => u.uid !== userId));
    firestoreUsers.delete(userId);
    return { success: true };
  };

  /**
   * Super Admin & Admin: Update user profile & role
   */
  const updateUser = async (uid: string, data: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    let targetUpdated: UserProfile | undefined;
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const isJuliett = u.username.toLowerCase() === 'juliett.souza';
          let finalRole = u.role;
          if (data.role) {
            if (isJuliett) {
              finalRole = 'superadmin';
            } else if (['user', 'paciente', 'cuidador', 'responsavel'].includes(data.role)) {
              finalRole = data.role;
            } else {
              finalRole = 'user';
            }
          }

          const updated = {
            ...u,
            ...data,
            role: finalRole,
            securityAnswer: data.securityAnswer ? data.securityAnswer.trim().toLowerCase() : u.securityAnswer,
            updatedAt: new Date().toISOString(),
          };
          targetUpdated = updated;
          if (currentUser?.uid === uid) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    if (targetUpdated) {
      firestoreUsers.save(targetUpdated);
    }
    return { success: true };
  };

  /**
   * Super Admin: Delete user
   */
  const deleteUser = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    if (target.username.toLowerCase() === 'juliett.souza') {
      return { success: false, error: 'O Super Administrador principal (Juliett.Souza) não pode ser excluído.' };
    }

    if (currentUser?.uid === uid) {
      return { success: false, error: 'Você não pode excluir sua própria conta enquanto estiver logado.' };
    }

    setUsersList((prev) => prev.filter((u) => u.uid !== uid));
    firestoreUsers.delete(uid);
    return { success: true };
  };

  /**
   * Super Admin & Admin: Toggle active/inactive
   */
  const toggleUserStatus = async (uid: string): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find((u) => u.uid === uid);
    if (!target) return { success: false, error: 'Usuário não encontrado.' };

    if (target.username.toLowerCase() === 'juliett.souza') {
      return { success: false, error: 'A conta Super Admin não pode ser desativada.' };
    }

    let updatedTarget: UserProfile | undefined;
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const upd = { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() };
          updatedTarget = upd;
          return upd;
        }
        return u;
      })
    );
    if (updatedTarget) {
      firestoreUsers.save(updatedTarget);
    }
    return { success: true };
  };

  /**
   * Super Admin & Admin: Reset password on behalf of user
   */
  const resetUserPasswordByAdmin = async (
    uid: string, 
    tempPass: string, 
    forceChange: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    let updatedTarget: UserProfile | undefined;
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const upd = {
            ...u,
            password: tempPass,
            mustChangePassword: forceChange,
            updatedAt: new Date().toISOString(),
          };
          updatedTarget = upd;
          return upd;
        }
        return u;
      })
    );
    if (updatedTarget) {
      firestoreUsers.save(updatedTarget);
    }
    return { success: true };
  };

  // Fallback compatibility functions
  const loginEmail = async (email: string, pass: string) => {
    await loginWithCredentials(email, pass);
  };

  const registerEmail = async (email: string, pass: string, name: string, userRole: UserRole = 'admin') => {
    await registerUser({
      username: email.split('@')[0],
      email,
      displayName: name,
      password: pass,
      role: userRole,
      mustChangePassword: userRole === 'admin' ? false : true,
      isActive: true,
    });
  };

  const loginGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // Demo Google fallback
      const user: UserProfile = {
        uid: 'google_user_123',
        adminId: 'google_user_123',
        username: 'maria.admin',
        email: 'maria.admin@gmail.com',
        displayName: 'Maria Administradora (Clínico)',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'admin',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      firestoreUsers.save(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('cs_user');
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.log('Password reset sent to', email);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    if (currentUser.username?.toLowerCase() !== 'juliett.souza' && (newRole === 'superadmin' || newRole === 'admin')) {
      return;
    }
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
    firestoreUsers.save(updated);
  };

  const demoLogin = (demoRole: UserRole) => {
    if (demoRole === 'superadmin') {
      const u = usersList.find((x) => x.username.toLowerCase() === 'juliett.souza') || INITIAL_SYSTEM_USERS[0];
      setCurrentUser(u);
    } else {
      const u = usersList.find((x) => x.username.toLowerCase() === 'dona.francisca') || INITIAL_SYSTEM_USERS[2];
      setCurrentUser(u);
    }
  };

  const isGeneralAdmin = currentUser?.username?.toLowerCase() === 'juliett.souza';
  const role: UserRole = isGeneralAdmin
    ? 'superadmin'
    : (currentUser?.role === 'superadmin' || currentUser?.role === 'admin' ? 'user' : (currentUser?.role || 'user'));
  const isSuperAdmin = isGeneralAdmin;
  const isAdmin = isGeneralAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        role,
        isSuperAdmin,
        isAdmin,
        usersList,
        loginWithCredentials,
        completeFirstSetup,
        getSecurityQuestionForUser,
        recoverPasswordWithQuestion,
        registerUser,
        createOrUpdateSubUserForPatient,
        deleteSubUserForPatient,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPasswordByAdmin,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        resetPassword,
        switchRole,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
