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
  registerUser: (userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
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

// Initial Super Admin & Demo System Users
const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    uid: 'user_superadmin_juliett',
    username: 'Juliett.Souza',
    email: 'juliett.souza@cuidadosenior.app',
    displayName: 'Juliett Souza (Super Administradora)',
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
    uid: 'user_admin_dra_ana',
    adminId: 'user_admin_dra_ana',
    username: 'dra.ana',
    email: 'dra.ana@cuidadosenior.app',
    displayName: 'Dra. Ana Costa (Administradora Médica)',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    role: 'admin',
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
    uid: 'user_cuidador_joao',
    adminId: 'user_admin_dra_ana',
    username: 'joao.cuidador',
    email: 'joao.cuidador@cuidadosenior.app',
    displayName: 'João Oliveira (Cuidador de Plantão)',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'user',
    password: 'Cuidador123',
    mustChangePassword: false,
    securityQuestion: 'Qual é a cidade em que você nasceu?',
    securityAnswer: 'sao paulo',
    isActive: true,
    phone: '(11) 98888-1111',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_familiar_maria',
    adminId: 'user_admin_dra_ana',
    username: 'maria.filha',
    email: 'maria.santos@cuidadosenior.app',
    displayName: 'Maria Santos (Filha Responsável)',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    role: 'user',
    password: 'Familia2026',
    mustChangePassword: false,
    securityQuestion: 'Qual foi o modelo do seu primeiro carro?',
    securityAnswer: 'gol',
    isActive: true,
    phone: '(11) 97777-2222',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load registered users list from localStorage
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('cs_system_users');
    if (!saved) {
      localStorage.setItem('cs_system_users', JSON.stringify(INITIAL_SYSTEM_USERS));
      return INITIAL_SYSTEM_USERS;
    }
    try {
      const parsed = JSON.parse(saved);
      // Ensure Juliett.Souza is present
      const hasJuliett = parsed.some((u: UserProfile) => u.username?.toLowerCase() === 'juliett.souza');
      if (!hasJuliett) {
        const merged = [INITIAL_SYSTEM_USERS[0], ...parsed];
        localStorage.setItem('cs_system_users', JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return INITIAL_SYSTEM_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cs_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u?.mustChangePassword) {
          localStorage.removeItem('cs_user');
          return null;
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
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = userData.username.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate
    const exists = usersList.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );

    if (exists) {
      return { success: false, error: 'Já existe um usuário com este Nome de Usuário ou E-mail.' };
    }

    const assignedRole = userData.role || 'admin';
    const assignedAdminId = userData.adminId || (currentUser?.role === 'admin' ? currentUser.uid : undefined);

    const now = new Date().toISOString();
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newUser: UserProfile = {
      ...userData,
      uid,
      adminId: assignedAdminId || (assignedRole === 'admin' ? uid : undefined),
      username: cleanUsername,
      email: cleanEmail,
      role: assignedRole,
      isActive: userData.isActive ?? true,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : (assignedRole === 'admin' ? false : true),
      securityAnswer: userData.securityAnswer ? userData.securityAnswer.trim().toLowerCase() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    setUsersList((prev) => [newUser, ...prev]);
    firestoreUsers.save(newUser);
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
          const updated = {
            ...u,
            ...data,
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
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
    firestoreUsers.save(updated);
  };

  const demoLogin = (demoRole: UserRole) => {
    if (demoRole === 'superadmin') {
      const u = usersList.find((x) => x.role === 'superadmin') || INITIAL_SYSTEM_USERS[0];
      setCurrentUser(u);
    } else if (demoRole === 'admin') {
      const u = usersList.find((x) => x.role === 'admin') || INITIAL_SYSTEM_USERS[1];
      setCurrentUser(u);
    } else {
      const u = usersList.find((x) => x.role === 'user') || INITIAL_SYSTEM_USERS[2];
      setCurrentUser(u);
    }
  };

  const role = currentUser?.role || 'user';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';

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
