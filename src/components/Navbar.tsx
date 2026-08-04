import React from 'react';
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
} from 'lucide-react';
import { audioService } from '../services/audio';

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
  const { currentUser, role, logout, switchRole } = useAuth();
  const {
    patient,
    activeCaregiverOnDuty,
    isOffline,
    settings,
    updateSettings,
    currentView,
    setCurrentView,
  } = useApp();

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
      {/* Top Banner: Active Patient & Duty Caregiver Info */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between text-white text-xs sm:text-sm bg-black/10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <HeartPulse className="w-4 h-4 text-[#BFE8D6] animate-pulse" />
            <span>Paciente: <strong className="text-[#BFE8D6]">{patient.fullName.split(' ')[0]} {patient.fullName.split(' ')[1] || ''}</strong></span>
          </div>

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
              className="flex items-center gap-1 bg-[#63C6A7] hover:bg-[#52b596] text-[#1F2E2C] text-xs font-bold px-2.5 py-1 rounded-full transition shadow-sm"
              title="Instalar aplicativo PWA"
            >
              <Download className="w-3.5 h-3.5" /> Instalar App
            </button>
          )}

          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => switchRole('admin')}
              className={`px-2 py-0.5 text-xs rounded font-medium transition ${
                role === 'admin' ? 'bg-[#63C6A7] text-[#1F2E2C] font-bold' : 'text-white hover:bg-white/10'
              }`}
              title="Visão com permissões completas de Administrador"
            >
              <Shield className="w-3 h-3 inline mr-1" /> Admin
            </button>
            <button
              onClick={() => switchRole('user')}
              className={`px-2 py-0.5 text-xs rounded font-medium transition ${
                role === 'user' ? 'bg-[#63C6A7] text-[#1F2E2C] font-bold' : 'text-white hover:bg-white/10'
              }`}
              title="Visão simplificada do Paciente/Cuidador"
            >
              <User className="w-3 h-3 inline mr-1" /> Usuário
            </button>
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

          {/* User Auth Info */}
          {currentUser ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
              <img
                src={currentUser.photoURL || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100'}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full border-2 border-[#63C6A7] object-cover"
              />
              <button
                onClick={logout}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Sair da conta"
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
        </div>
      </nav>
    </header>
  );
};
