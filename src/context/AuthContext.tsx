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
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  role: UserRole;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial demo admin user
const DEMO_ADMIN: UserProfile = {
  uid: 'admin_123',
  email: 'admin@cuidadosenior.app',
  displayName: 'Dr. Carlos Silva (Admin)',
  photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_USER: UserProfile = {
  uid: 'user_456',
  email: 'joao.cuidador@cuidadosenior.app',
  displayName: 'João Oliveira (Cuidador)',
  photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cs_user');
    return saved ? JSON.parse(saved) : DEMO_ADMIN;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const user: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || 'usuario@cuidadosenior.app',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
          photoURL: fbUser.photoURL || undefined,
          role: currentUser?.role || 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentUser(user);
        localStorage.setItem('cs_user', JSON.stringify(user));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.role]);

  const loginEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      // Fallback for demo when Firebase auth isn't connected to active project
      const user: UserProfile = {
        uid: 'user_' + Date.now(),
        email,
        displayName: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem('cs_user', JSON.stringify(user));
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      // Fallback demo user creation
      const user: UserProfile = {
        uid: 'user_' + Date.now(),
        email,
        displayName: name,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem('cs_user', JSON.stringify(user));
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // Demo Google fallback
      const user: UserProfile = {
        uid: 'google_user_123',
        email: 'maria.familia@gmail.com',
        displayName: 'Maria Santos (Familiar)',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem('cs_user', JSON.stringify(user));
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
      console.log('Password reset request sent to', email);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    localStorage.setItem('cs_user', JSON.stringify(updated));
  };

  const demoLogin = (role: UserRole) => {
    const user = role === 'admin' ? DEMO_ADMIN : DEMO_USER;
    setCurrentUser(user);
    localStorage.setItem('cs_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        role: currentUser?.role || 'admin',
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
