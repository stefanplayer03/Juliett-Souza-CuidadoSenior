import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SmartCalendar } from './components/SmartCalendar';
import { MedicationManagement } from './components/MedicationManagement';
import { PatientManagement } from './components/PatientManagement';
import { MedicalRecordView } from './components/MedicalRecordView';
import { CaregiverManagement } from './components/CaregiverManagement';
import { DoctorManagement } from './components/DoctorManagement';
import { AuditHistory } from './components/AuditHistory';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Download, AlertCircle } from 'lucide-react';

export function App() {
  const { currentView, settings, isOffline } = useApp();
  const { role } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA install');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Senior font size modifier
  const fontClass =
    settings.fontSize === 'xlarge'
      ? 'text-lg'
      : settings.fontSize === 'large'
      ? 'text-base'
      : 'text-sm';

  return (
    <div className={`min-h-screen bg-[#E9F7F2] text-[#1F2E2C] font-sans transition-all ${fontClass}`}>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-black py-2 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
          <AlertCircle className="w-4 h-4 animate-pulse" /> Você está no Modo Offline. As alterações serão salvas localmente e sincronizadas assim que a conexão retornar.
        </div>
      )}

      {/* Main Navbar Header */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container View Switcher */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'calendar' && <SmartCalendar />}
        {currentView === 'medications' && <MedicationManagement />}
        {currentView === 'patient' && <PatientManagement />}
        {currentView === 'records' && <MedicalRecordView />}
        {currentView === 'caregivers' && <CaregiverManagement />}
        {currentView === 'doctors' && <DoctorManagement />}
        {currentView === 'history' && <AuditHistory />}
      </main>

      {/* Modals */}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onInstallPWA={handleInstallPWA}
          deferredPrompt={deferredPrompt}
        />
      )}
    </div>
  );
}

export default App;
