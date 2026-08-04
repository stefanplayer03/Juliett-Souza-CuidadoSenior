import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, User, Mail, Lock, LogIn, UserPlus, KeyRound, Sparkles, X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { loginEmail, registerEmail, loginGoogle, resetPassword, demoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await loginEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        await registerEmail(email, password, name, selectedRole);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMessage('E-mail de recuperação de senha enviado com sucesso!');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro no login.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginGoogle();
      onClose();
    } catch (err: any) {
      setError('Erro ao autenticar com Google.');
    }
  };

  const handleDemo = (role: UserRole) => {
    demoLogin(role);
    onClose();
  };

  return (
    <div className="fixed inset-[#0] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#E9F7F2] rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-[#63C6A7] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-4 border-b border-[#BFE8D6]">
          <h2 className="text-2xl font-black text-[#1F2E2C]">
            {mode === 'login' ? 'Acessar Conta' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Sistema de Autenticação Firebase
          </p>
        </div>

        {/* Quick Demo Access Toggles */}
        <div className="my-4 bg-white p-3 rounded-2xl border-2 border-[#BFE8D6] space-y-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase block text-center">
            Acesso Rápido de Teste (Sem Custo)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemo('admin')}
              className="py-2 px-3 bg-[#2F7E6A] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <Shield className="w-3.5 h-3.5 text-[#BFE8D6]" /> Entrar como Admin
            </button>
            <button
              onClick={() => handleDemo('user')}
              className="py-2 px-3 bg-[#63C6A7] text-[#1F2E2C] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <User className="w-3.5 h-3.5" /> Entrar como Cuidador
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-800 text-xs font-bold rounded-xl mb-3">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-100 border border-rose-400 text-rose-800 text-xs font-bold rounded-xl mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome..."
                className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1F2E2C] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nível de Acesso</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              >
                <option value="admin">Administrador (Acesso Completo)</option>
                <option value="user">Usuário (Visualizar & Confirmar)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-xl shadow-md transition"
          >
            {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Minha Conta' : 'Enviar E-mail de Recuperação'}
          </button>
        </form>

        {/* Google Provider Button */}
        <div className="mt-3 text-center space-y-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#BFE8D6]"></div>
            <span className="flex-shrink mx-2 text-[10px] text-gray-500 font-bold uppercase">ou</span>
            <div className="flex-grow border-t border-[#BFE8D6]"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-white hover:bg-gray-50 text-[#1F2E2C] font-bold text-xs rounded-xl border-2 border-[#BFE8D6] shadow-xs flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Entrar com Google
          </button>
        </div>

        {/* Mode Toggles */}
        <div className="mt-4 pt-3 border-t border-[#BFE8D6] flex justify-between text-xs font-bold text-[#2F7E6A]">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('register')}>Criar Conta</button>
              <button onClick={() => setMode('forgot')}>Esqueci minha senha</button>
            </>
          ) : (
            <button onClick={() => setMode('login')} className="mx-auto">
              Voltar para o Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
