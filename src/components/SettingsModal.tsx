import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Volume2, Type, Bell, Wifi, Shield, Download, X } from 'lucide-react';
import { audioService } from '../services/audio';

interface SettingsModalProps {
  onClose: () => void;
  onInstallPWA?: () => void;
  deferredPrompt?: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onInstallPWA,
  deferredPrompt,
}) => {
  const { settings, updateSettings, isOffline } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#E9F7F2] rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-[#63C6A7] relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-3 border-b border-[#BFE8D6]">
          <h2 className="text-xl font-black text-[#1F2E2C] flex items-center justify-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#2F7E6A]" /> Configurações do Aplicativo
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-0.5">
            Acessibilidade para idosos, notificações e PWA
          </p>
        </div>

        {/* Font Size Selector */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] space-y-2">
          <label className="block text-xs font-bold text-[#1F2E2C] flex items-center gap-1.5">
            <Type className="w-4 h-4 text-[#2F7E6A]" /> Tamanho da Fonte (Acessibilidade Idosos)
          </label>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => { audioService.playClickSound(); updateSettings({ fontSize: 'normal' }); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                settings.fontSize === 'normal'
                  ? 'bg-[#2F7E6A] text-white shadow'
                  : 'bg-[#E9F7F2] text-[#1F2E2C]'
              }`}
            >
              Normal (16px)
            </button>
            <button
              onClick={() => { audioService.playClickSound(); updateSettings({ fontSize: 'large' }); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                settings.fontSize === 'large'
                  ? 'bg-[#2F7E6A] text-white shadow'
                  : 'bg-[#E9F7F2] text-[#1F2E2C]'
              }`}
            >
              Grande (18px)
            </button>
            <button
              onClick={() => { audioService.playClickSound(); updateSettings({ fontSize: 'xlarge' }); }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                settings.fontSize === 'xlarge'
                  ? 'bg-[#2F7E6A] text-white shadow'
                  : 'bg-[#E9F7F2] text-[#1F2E2C]'
              }`}
            >
              Extra (20px)
            </button>
          </div>
        </div>

        {/* Audio Feedback Toggles */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1F2E2C] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#2F7E6A]" /> Sons e Sinal sonoro de dose
            </span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 text-[#2F7E6A] rounded"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs font-bold text-[#1F2E2C] flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#2F7E6A]" /> Leitura de Voz (Text-to-Speech)
            </span>
            <input
              type="checkbox"
              checked={settings.ttsEnabled}
              onChange={(e) => updateSettings({ ttsEnabled: e.target.checked })}
              className="w-4 h-4 text-[#2F7E6A] rounded"
            />
          </div>
        </div>

        {/* Escalation Delay Configuration */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] space-y-2">
          <label className="block text-xs font-bold text-[#1F2E2C] flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#2F7E6A]" /> Tempo de Re-Lembrete de Medicamento
          </label>
          <select
            value={settings.autoEscalateMinutes}
            onChange={(e) => updateSettings({ autoEscalateMinutes: Number(e.target.value) })}
            className="w-full p-2.5 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs font-bold text-[#1F2E2C]"
          >
            <option value={15}>Primeiro lembrete + 15 min</option>
            <option value={30}>Primeiro lembrete + 30 min (Escala aos responsáveis)</option>
            <option value={60}>Primeiro lembrete + 1 hora (Registra como esquecido)</option>
          </select>
        </div>

        {/* PWA Info */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-[#1F2E2C]">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-[#2F7E6A]" /> Conexão PWA
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isOffline ? 'Modo Offline' : 'Conectado'}
            </span>
          </div>
          {deferredPrompt && onInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="w-full mt-2 py-2.5 bg-[#2F7E6A] text-white font-extrabold rounded-xl shadow flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Instalar Aplicativo no Dispositivo
            </button>
          )}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-xs rounded-xl shadow"
          >
            Fechar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};
