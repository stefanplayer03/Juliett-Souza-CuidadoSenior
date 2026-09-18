import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Pill,
  UserCheck,
  Volume2,
  VolumeX,
  Type,
  WifiOff,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  Calendar,
  History,
  FileText,
  Users,
  Stethoscope,
  HeartPulse,
  Settings as SettingsIcon,
  Download,
  KeyRound,
  Camera,
} from 'lucide-react';
import { audioService } from '../services/audio';
import { ProfilePhotoModal } from './ProfilePhotoModal';

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  deferredPrompt?: any;
  onInstallPWA?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  onOpenAuth,
  onOpenSettings,
  deferredPrompt,
  onInstallPWA,
}) => {
  const { currentUser, role, isSuperAdmin, isAdmin, logout, switchRole, updateUser } = useAuth();
  const {
    patients,
    patient,
    updatePatient,
    selectPatientById,
    activeCaregiverOnDuty,
    isOffline,
    settings,
    updateSettings,
    currentView,
    setCurrentView,
    setIsFirstSetupOpen,
  } = useApp();

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handleSavePhoto = async (newPhoto: string) => {
    if (!currentUser) return;
    await updateUser(currentUser.uid, { photoURL: newPhoto });
    if (patient && (patient.userId === currentUser.uid || currentUser.role === 'paciente' || currentUser.isPrimaryPatientAccount)) {
      updatePatient(patient.id, { photo: newPhoto }, currentUser.displayName);
    }
  };

  const activeTab = propActiveTab || currentView;
  const setActiveTab = propSetActiveTab || setCurrentView;

  const handleFontSizeCycle = () => {
    audioService.playClickSound();
    if (settings.fontSize === 'normal') updateSettings({ fontSize: 'large' });
    else if (settings.fontSize === 'large') updateSettings({ fontSize: 'xlarge' });
    else updateSettings({ fontSize: 'normal' });
  };

  const toggleSound = () => {
    audioService.playClickSound();
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm border-b border-[#BFE8D6]" style={{ backgroundColor: '#2F7E6A' }}>
      {/* Top Banner: Active Patient & Duty Caregiver Info & System Status */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between text-white text-xs sm:text-sm bg-black/10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <HeartPulse className="w-4 h-4 text-[#BFE8D6] animate-pulse" />
            <span>Paciente: <strong className="text-[#BFE8D6]">{patient.fullName}</strong></span>
          </div>

          {/* Quick switcher for Admin */}
          {(isAdmin || isSuperAdmin) && patients.length > 1 && (
            <div className="flex items-center gap-1">
              <span className="hidden md:inline text-[11px] text-white/80">Trocar:</span>
              <select
                value={patient.id}
                onChange={(e) => selectPatientById(e.target.value)}
                className="bg-white/20 text-white text-xs font-bold rounded-lg px-2 py-0.5 border border-white/30 focus:outline-none cursor-pointer"
                title="Trocar Paciente Ativo"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="text-[#1F2E2C]">
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Setup pending badge */}
          {patient.isFirstSetupCompleted === false && (
            <button
              onClick={() => setIsFirstSetupOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-2 py-0.5 rounded-full text-[11px] animate-pulse cursor-pointer shadow-sm"
              title="Clique para completar o cadastro dos seus responsáveis, ficha médica e medicamentos"
            >
              Completar Cadastro
            </button>
          )}

          {activeCaregiverOnDuty && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#BFE8D6]" />
              <span>Plantão: <strong>{activeCaregiverOnDuty.name} ({activeCaregiverOnDuty.relationship})</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOffline && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-bounce">
              <WifiOff className="w-3 h-3" /> Offline (Modo PWA)
            </span>
          )}

          {deferredPrompt && (
            <button
              onClick={onInstallPWA}
              className="flex items-center gap-1 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] text-xs font-bold px-2.5 py-1 rounded-full transition shadow-sm cursor-pointer"
              title="Instalar aplicativo PWA"
            >
              <Download className="w-3.5 h-3.5" /> Instalar App
            </button>
          )}

          {/* User Role Pill Tag */}
          <div className="flex items-center bg-white/15 px-2.5 py-0.5 rounded-lg text-xs">
            {role === 'superadmin' ? (
              <span className="text-[#BFE8D6] font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#63C6A7]" /> Super ADMIN
              </span>
            ) : role === 'admin' ? (
              <span className="text-[#BFE8D6] font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#63C6A7]" /> Administrador
              </span>
            ) : currentUser?.role === 'paciente' || currentUser?.isPrimaryPatientAccount ? (
              <span className="text-amber-200 font-extrabold flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Paciente Titular
              </span>
            ) : currentUser?.isSubAccount || currentUser?.patientId ? (
              <span className="text-[#BFE8D6] font-extrabold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Subcadastro (Responsável)
              </span>
            ) : (
              <span className="text-white font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Cuidador
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#63C6A7] flex items-center justify-center text-[#2F7E6A] shadow-md group-hover:scale-105 transition">
            <Pill className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none flex items-center gap-1.5">
              CuidadoSenior
            </h1>
            <p className="text-[11px] text-[#BFE8D6] font-medium tracking-wide">
              Controle Inteligente de Medicamentos
            </p>
          </div>
        </div>

        {/* Accessibility Tools & Profile */}
        <div className="flex items-center gap-2">
          {/* Font Size Button */}
          <button
            onClick={handleFontSizeCycle}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition shadow-sm border border-white/20"
            title="Ajustar tamanho da fonte para idosos"
          >
            <Type className="w-4 h-4 text-[#BFE8D6]" />
            <span className="uppercase">{settings.fontSize}</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition shadow-sm border border-white/20"
            title={settings.soundEnabled ? 'Sons ativados' : 'Sons desativados'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#BFE8D6]" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-300" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition shadow-sm border border-white/20"
            title="Configurações do sistema"
          >
            <SettingsIcon className="w-4 h-4 text-[#BFE8D6]" />
          </button>

          {/* User Auth Info / Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/20">
              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setIsPhotoModalOpen(true);
                }}
                className="flex items-center gap-2 group p-1 rounded-2xl hover:bg-white/10 transition cursor-pointer text-left"
                title="Clique para inserir ou trocar sua foto de perfil"
              >
                <div className="relative">
                  <img
                    src={currentUser.photoURL || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                    alt={currentUser.displayName}
                    className="w-8 h-8 rounded-full border-2 border-[#63C6A7] object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#2F7E6A] text-white p-0.5 rounded-full border border-white opacity-90 group-hover:opacity-100">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px] group-hover:text-[#BFE8D6] transition">
                    {currentUser.displayName}
                  </div>
                  <div className="text-[10px] text-[#BFE8D6] font-mono leading-tight">
                    @{currentUser.username || 'usuario'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioService.playClickSound();
                  setIsPhotoModalOpen(true);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-[#BFE8D6] hover:text-white rounded-xl transition border border-white/20 cursor-pointer"
                title="Trocar Foto de Perfil"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="p-2 text-white/80 hover:text-white hover:bg-rose-600/80 rounded-xl transition cursor-pointer"
                title="Sair da conta e voltar ao login"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="ml-2 px-3 py-1.5 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] font-bold text-xs rounded-xl transition shadow-sm"
            >
              Entrar
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="bg-[#1F2E2C]/30 backdrop-blur-md overflow-x-auto no-scrollbar border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 py-1.5 min-w-max">
          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('dashboard'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'dashboard'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Pill className="w-4 h-4" /> Dashboard
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('calendar'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'calendar'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendário
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('medications'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'medications'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Pill className="w-4 h-4" /> Medicamentos
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('patient'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'patient'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Paciente
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('records'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'records'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Ficha Médica
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('caregivers'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'caregivers'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Responsáveis
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('doctors'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'doctors'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Médicos
          </button>

          <button
            onClick={() => { audioService.playClickSound(); setActiveTab('history'); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'history'
                ? 'bg-[#63C6A7] text-[#1F2E2C] shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" /> Histórico Auditável
          </button>

          {/* Super Admin & Admin User Control Tab */}
          {isAdmin && (
            <button
              onClick={() => { audioService.playClickSound(); setActiveTab('users'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                  : 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Gestão de Usuários
            </button>
          )}
        </div>
      </nav>

      {/* Global Profile Photo Edit Modal for Any Logged-in Profile */}
      {currentUser && (
        <ProfilePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          currentPhoto={currentUser.photoURL}
          userName={currentUser.displayName}
          userLogin={currentUser.username}
          userRole={
            currentUser.role === 'superadmin'
              ? 'Super Administrador'
              : currentUser.role === 'admin'
              ? 'Administrador Clínico'
              : currentUser.role === 'paciente'
              ? 'Paciente Titular'
              : currentUser.role === 'cuidador'
              ? 'Cuidador'
              : currentUser.role === 'responsavel'
              ? 'Responsável Familiar'
              : 'Usuário'
          }
          onSavePhoto={handleSavePhoto}
        />
      )}
    </header>
  );
};
