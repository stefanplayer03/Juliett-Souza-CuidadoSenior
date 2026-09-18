import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SECURITY_QUESTIONS, UserRole, Patient } from '../types';
import { firestorePatients } from '../firebase/db';
import {
  Pill,
  Shield,
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Smartphone,
  WifiOff,
  HeartPulse,
  Users,
  ChevronRight,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';

interface SaaSLoginProps {
  onSuccess?: () => void;
}

export const SaaSLogin: React.FC<SaaSLoginProps> = ({ onSuccess }) => {
  const {
    currentUser,
    loginWithCredentials,
    completeFirstSetup,
    getSecurityQuestionForUser,
    recoverPasswordWithQuestion,
    registerUser,
    loading,
    demoLogin,
  } = useAuth();

  // Mode: 'login' | 'first_setup' | 'recover_question' | 'register'
  const [mode, setMode] = useState<'login' | 'first_setup' | 'recover_question' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // First setup / Mandatory password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Password Recovery state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [retrievedQuestion, setRetrievedQuestion] = useState<string | null>(null);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('paciente');
  const [regPassword, setRegPassword] = useState('');
  const [regQuestion, setRegQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [regAnswer, setRegAnswer] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handler for normal Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Por favor, informe seu usuário ou e-mail e senha.');
      return;
    }

    try {
      const res = await loginWithCredentials(identifier, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao realizar login. Verifique suas credenciais.');
        return;
      }

      if (res.mustChangePassword) {
        setMode('first_setup');
        setSuccessMessage('Primeiro acesso detectado! Defina sua nova senha definitiva e sua pergunta de recuperação.');
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado no servidor.');
    }
  };

  // Handler for First Setup (Troca Obrigatória de Senha + Pergunta Secreta)
  const handleFirstSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    const questionToSave = isCustomQuestion ? customQuestionText.trim() : selectedQuestion;
    if (!questionToSave) {
      setErrorMessage('Por favor, defina uma pergunta de segurança.');
      return;
    }

    if (!securityAnswer.trim() || securityAnswer.trim().length < 2) {
      setErrorMessage('Por favor, informe a resposta secreta para a sua pergunta de segurança.');
      return;
    }

    try {
      const res = await completeFirstSetup(newPassword, questionToSave, securityAnswer);
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao salvar credenciais.');
        return;
      }

      setSuccessMessage('Senha atualizada e pergunta de segurança cadastrada com sucesso! Bem-vindo ao sistema.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao concluir primeiro acesso.');
    }
  };

  // Step 1 of Password Recovery: fetch question
  const handleLookupQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recoveryIdentifier.trim()) {
      setErrorMessage('Digite seu usuário ou e-mail cadastrado.');
      return;
    }

    const question = getSecurityQuestionForUser(recoveryIdentifier);
    if (!question) {
      setErrorMessage('Nenhuma pergunta de segurança encontrada para este usuário. Verifique o nome digitado ou contate o Super Admin.');
      return;
    }

    setRetrievedQuestion(question);
    setSuccessMessage('Pergunta de segurança encontrada! Responda abaixo para criar uma nova senha.');
  };

  // Step 2 of Password Recovery: validate answer and update password
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recoveryAnswer.trim()) {
      setErrorMessage('Por favor, informe a resposta de segurança.');
      return;
    }

    if (recoveryNewPassword.length < 6) {
      setErrorMessage('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMessage('A confirmação de senha não coincide.');
      return;
    }

    try {
      const res = await recoverPasswordWithQuestion(recoveryIdentifier, recoveryAnswer, recoveryNewPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Resposta incorreta.');
        return;
      }

      setSuccessMessage('Senha redefinida com sucesso! Você já está autenticado no sistema.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao redefinir senha.');
    }
  };

  // Handler for New User Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('A senha de acesso deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!regAnswer.trim()) {
      setErrorMessage('Cadastre a resposta para a pergunta de segurança.');
      return;
    }

    try {
      const cleanUsername = regUsername.trim();
      const isJuliett = cleanUsername.toLowerCase() === 'juliett.souza';
      const assignedRole: UserRole = isJuliett ? 'superadmin' : 'user';

      const res = await registerUser({
        displayName: regName.trim(),
        username: cleanUsername,
        email: regEmail.trim().toLowerCase(),
        role: assignedRole,
        password: regPassword,
        securityQuestion: regQuestion,
        securityAnswer: regAnswer,
        mustChangePassword: false,
        isActive: true,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar usuário.');
        return;
      }

      // If registered as regular user/patient, automatically provision their isolated patient record
      if (!isJuliett) {
        const customId = `PAC-${Math.floor(1000 + Math.random() * 9000)}`;
        const userUid = res.user?.uid || `user_${Date.now()}`;
        const newPatient: Patient = {
          id: customId,
          userId: userUid,
          adminId: 'user_superadmin_juliett',
          fullName: regName.trim(),
          cpf: 'Não informado',
          birthDate: '1955-01-01',
          phone: '',
          emergencyPhone: '',
          address: '',
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
          bloodType: 'O+',
          weight: 65,
          height: 1.6,
          allergies: [],
          diseases: [],
          notes: 'Paciente cadastrado via portal CuidadoSenior.',
          isFirstSetupCompleted: false, // Triggers First Setup Wizard
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          const rawPatients = localStorage.getItem('cs_patients_list');
          const currentList: Patient[] = rawPatients ? JSON.parse(rawPatients) : [];
          const updatedList = [newPatient, ...currentList.filter((p) => p.id !== customId)];
          localStorage.setItem('cs_patients_list', JSON.stringify(updatedList));
          localStorage.setItem('cs_active_patient_id', customId);
        } catch (e) {
          console.warn('LocalStorage save notice:', e);
        }
        firestorePatients.save(newPatient).catch(console.warn);
      }

      setSuccessMessage(
        !isJuliett
          ? `Usuário "${regName}" cadastrado com sucesso! Acessando os dados do paciente...`
          : `Administradora Geral "${regUsername}" autenticada com sucesso!`
      );

      setTimeout(async () => {
        const loginRes = await loginWithCredentials(regUsername, regPassword);
        if (loginRes.success) {
          if (onSuccess) onSuccess();
        } else {
          setIdentifier(regUsername);
          setPassword(regPassword);
          setMode('login');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#122B24] via-[#1A3D33] to-[#2F7E6A] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-[#1F2E2C]">
      {/* Main SaaS Container Box */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border-4 border-[#63C6A7]/40 min-h-[640px]">
        
        {/* Left Hero & Value Proposition Panel (SaaS Branding) */}
        <div className="lg:col-span-5 bg-[#1F2E2C] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Accent Patterns */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#63C6A7]/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#2F7E6A]/25 blur-3xl pointer-events-none"></div>

          <div>
            {/* SaaS Brand Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2F7E6A] to-[#63C6A7] flex items-center justify-center shadow-lg text-white">
                <Pill className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  CuidadoSenior
                  <span className="text-[10px] bg-[#63C6A7] text-[#1F2E2C] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    SaaS PRO
                  </span>
                </span>
                <p className="text-xs text-[#BFE8D6] font-medium">
                  Gestão Humanizada & Inteligência Clínica
                </p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-3">
              Cuidado farmacológico e acompanhamento clínico com segurança total.
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Plataforma de alta precisão para controle de medicamentos, alarmes inteligentes, histórico de administração auditável e integração multiprofissional.
            </p>
          </div>

          {/* Bottom Security Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span>© 2026 CuidadoSenior Platform</span>
            <span className="flex items-center gap-1 text-[#63C6A7]">
              <Lock className="w-3 h-3" /> Criptografia 256-bit
            </span>
          </div>
        </div>

        {/* Right Form Interaction Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 sm:py-10 bg-[#F7FCFA] flex flex-col justify-between overflow-y-auto">
          
          {/* Header Switcher / Mode Title */}
          <div>
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#BFE8D6]">
              <div>
                <h3 className="text-2xl font-black text-[#1F2E2C] tracking-tight">
                  {mode === 'login' && 'Acesso ao Portal'}
                  {mode === 'first_setup' && 'Primeiro Acesso: Troca de Senha'}
                  {mode === 'recover_question' && 'Recuperação de Senha'}
                  {mode === 'register' && 'Cadastro de Administrador Clínico'}
                </h3>
                <p className="text-xs text-[#2F7E6A] font-semibold mt-0.5">
                  {mode === 'login' && 'Entre com suas credenciais de usuário ou e-mail'}
                  {mode === 'first_setup' && 'Configure sua nova senha e pergunta de segurança'}
                  {mode === 'recover_question' && 'Responda à pergunta de segurança cadastrada'}
                  {mode === 'register' && 'Crie sua conta de gestão para gerenciar e atrelar seus pacientes e equipe'}
                </p>
              </div>

              {/* Back to login button if in other mode */}
              {mode !== 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="text-xs font-bold text-[#2F7E6A] hover:text-[#1F2E2C] bg-white border border-[#BFE8D6] px-3 py-1.5 rounded-xl hover:bg-gray-50 transition shadow-xs"
                >
                  Voltar ao Login
                </button>
              )}
            </div>

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* MODE 1: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username / Email Field */}
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1.5">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#63C6A7]/70 focus:border-[#2F7E6A] rounded-2xl text-sm font-semibold text-[#1F2E2C] placeholder-gray-400 focus:outline-none shadow-xs transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setMode('recover_question');
                      }}
                      className="text-xs font-bold text-[#2F7E6A] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-white border-2 border-[#63C6A7]/70 focus:border-[#2F7E6A] rounded-2xl text-sm font-semibold text-[#1F2E2C] placeholder-gray-400 focus:outline-none shadow-xs transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2F7E6A] focus:ring-[#63C6A7] border-gray-300"
                    />
                    Lembrar minhas credenciais neste navegador
                  </label>
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" /> Entrar no Sistema
                </button>
              </form>
            )}

            {/* MODE 2: FIRST ACCESS / MANDATORY PASSWORD & SECURITY QUESTION SETUP */}
            {mode === 'first_setup' && (
              <form onSubmit={handleFirstSetupSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium">
                  <strong>🔒 Configuração Obrigatória de Primeiro Acesso:</strong> Para garantir a segurança da conta 
                  <strong> {currentUser?.displayName || currentUser?.username || 'do usuário'}</strong>, 
                  defina sua nova senha definitiva e sua pergunta de recuperação.
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Nova Senha Definitiva (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha segura"
                      className="w-full pl-10 pr-11 py-2.5 bg-white border-2 border-[#63C6A7] focus:border-[#2F7E6A] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#63C6A7] focus:border-[#2F7E6A] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Security Question Selection */}
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Pergunta Secreta para Recuperação de Senha
                  </label>
                  <select
                    value={isCustomQuestion ? 'custom' : selectedQuestion}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomQuestion(true);
                      } else {
                        setIsCustomQuestion(false);
                        setSelectedQuestion(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] focus:border-[#2F7E6A] rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>
                        {q}
                      </option>
                    ))}
                    <option value="custom">✏️ Criar minha própria pergunta personalizada...</option>
                  </select>

                  {isCustomQuestion && (
                    <input
                      type="text"
                      required
                      value={customQuestionText}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      placeholder="Escreva sua pergunta de segurança personalizada..."
                      className="mt-2 w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  )}
                </div>

                {/* Security Answer */}
                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Resposta Secreta (não diferencia maiúsculas)
                  </label>
                  <div className="relative">
                    <HelpCircle className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#63C6A7] focus:border-[#2F7E6A] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Salvar Credenciais & Acessar Sistema
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    Voltar para a Tela de Login
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: PASSWORD RECOVERY VIA SECURITY QUESTION */}
            {mode === 'recover_question' && (
              <div className="space-y-4">
                {!retrievedQuestion ? (
                  // Step 1: Identifier lookup
                  <form onSubmit={handleLookupQuestion} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1.5">
                        Digite seu Usuário ou E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={recoveryIdentifier}
                          onChange={(e) => setRecoveryIdentifier(e.target.value)}
                          placeholder=""
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#63C6A7] rounded-2xl text-sm font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      Buscar Pergunta de Segurança <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  // Step 2: Answer question + set new password
                  <form onSubmit={handleRecoverSubmit} className="space-y-4 animate-in fade-in">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-semibold flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-gray-500 uppercase text-[10px]">Pergunta de Segurança:</span>
                        <strong className="text-sm text-blue-950">{retrievedQuestion}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                        Sua Resposta Secreta
                      </label>
                      <input
                        type="text"
                        required
                        value={recoveryAnswer}
                        onChange={(e) => setRecoveryAnswer(e.target.value)}
                        placeholder=""
                        className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Nova Senha
                        </label>
                        <input
                          type="password"
                          required
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          placeholder=""
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                          Confirmar Nova Senha
                        </label>
                        <input
                          type="password"
                          required
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          placeholder=""
                          className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Validar e Redefinir Senha
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MODE 4: REGISTER USER / PATIENT */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Role Notice */}
                <div className="bg-[#EAF6F0] border-2 border-[#2F7E6A]/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <User className="w-5 h-5 text-[#2F7E6A] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-[#1F2E2C]">Cadastro de Conta: Perfil Usuário</p>
                    <p className="text-[11px] text-[#2F7E6A] font-medium leading-relaxed mt-0.5">
                      Sua conta terá perfil de usuário com acesso dedicado e seguro aos dados do seu paciente cadastrado, medicações e cuidadores.
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-1">
                      * O perfil de Administrador Geral é exclusivo de <strong>Juliett.Souza</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder=""
                      className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                      Nome de Usuário (Login)
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder=""
                      className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                      E-mail Profissional
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder=""
                      className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                      Senha de Acesso (Definitiva)
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Pergunta Secreta
                  </label>
                  <select
                    value={regQuestion}
                    onChange={(e) => setRegQuestion(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1F2E2C] uppercase tracking-wider mb-1">
                    Resposta Secreta
                  </label>
                  <input
                    type="text"
                    required
                    value={regAnswer}
                    onChange={(e) => setRegAnswer(e.target.value)}
                    placeholder=""
                    className="w-full p-2.5 bg-white border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4 text-[#63C6A7]" /> Concluir Cadastro de Usuário / Paciente e Entrar
                </button>
              </form>
            )}
          </div>

          {/* Footer Navigation Tabs / Mode Switch */}
          <div className="mt-6 pt-4 border-t border-[#BFE8D6] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#2F7E6A]">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('register');
                  }}
                  className="hover:text-[#1F2E2C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ➕ Criar Nova Conta (Perfil Usuário / Paciente)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('recover_question');
                  }}
                  className="hover:text-[#1F2E2C] hover:underline flex items-center gap-1"
                >
                  🔑 Recuperar por Pergunta
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="hover:text-[#1F2E2C] hover:underline mx-auto flex items-center gap-1"
              >
                ← Retornar à Tela de Login
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
