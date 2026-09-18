import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { compressImageFile, PRESET_AVATARS, DEFAULT_AVATAR } from '../utils/imageUtils';
import { audioService } from '../services/audio';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoto?: string;
  userName: string;
  userRole?: string;
  userLogin?: string;
  onSavePhoto: (photoUrl: string) => Promise<void> | void;
  title?: string;
  subtitle?: string;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({
  isOpen,
  onClose,
  currentPhoto,
  userName,
  userRole,
  userLogin,
  onSavePhoto,
  title = 'Foto de Perfil',
  subtitle = 'Personalize sua imagem de perfil escolhendo uma foto da galeria ou um avatar.',
}) => {
  const [photoPreview, setPhotoPreview] = useState<string>(currentPhoto || DEFAULT_AVATAR);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setPhotoPreview(currentPhoto || DEFAULT_AVATAR);
      setUrlInput(currentPhoto && !currentPhoto.startsWith('data:') ? currentPhoto : '');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsProcessing(false);
      setActiveTab('upload');
    }
  }, [isOpen, currentPhoto]);

  if (!isOpen) return null;

  // Process image file selected from device / gallery
  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 320, 0.88);
      setPhotoPreview(compressedDataUrl);
      setSuccessMessage('Foto carregada com sucesso! Clique em "Salvar Foto de Perfil" para concluir.');
      audioService.playClickSound();
    } catch (err: any) {
      setErrorMessage(err.message || 'Não foi possível carregar a imagem. Verifique o formato.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  // Apply custom URL
  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Informe uma URL de imagem válida.');
      return;
    }
    setErrorMessage(null);
    setPhotoPreview(urlInput.trim());
    setSuccessMessage('Imagem via link definida! Clique em "Salvar Foto de Perfil" para concluir.');
    audioService.playClickSound();
  };

  // Save changes
  const handleSave = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await onSavePhoto(photoPreview);
      audioService.playClickSound();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar a foto de perfil.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setPhotoPreview(DEFAULT_AVATAR);
    setUrlInput('');
    setErrorMessage(null);
    setSuccessMessage('Avatar padrão restaurado! Clique em Salvar para confirmar.');
    audioService.playClickSound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#E9F7F2] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-4 border-[#63C6A7] max-h-[94vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#BFE8D6] mb-4">
          <div>
            <h3 className="text-xl font-black text-[#1F2E2C] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#2F7E6A]" /> {title}
            </h3>
            <p className="text-xs text-[#2F7E6A] font-semibold mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-xl transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Current Preview Banner */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#BFE8D6] flex items-center gap-3.5 mb-4 shadow-xs">
          <div className="relative shrink-0">
            <img
              src={photoPreview}
              alt={userName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
              className="w-16 h-16 rounded-full object-cover border-3 border-[#2F7E6A] shadow-sm bg-gray-100"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm text-[#1F2E2C] truncate">{userName}</div>
            {userLogin && (
              <div className="text-xs text-gray-500 font-mono">@{userLogin}</div>
            )}
            {userRole && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3 h-3" /> Perfil: {userRole}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2 text-gray-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition text-xs font-bold flex flex-col items-center gap-0.5 shrink-0 cursor-pointer"
            title="Restaurar avatar padrão"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px]">Restaurar</span>
          </button>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-2xl border border-[#BFE8D6] mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#2F7E6A] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Galeria / Arquivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-[#2F7E6A] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Avatares Prontos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-[#2F7E6A] text-white shadow-xs'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Link da Web
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: GALERIA DO APARELHO / ARQUIVO LOCAL                   */}
        {/* ============================================================ */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-7 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 block ${
                isDragging
                  ? 'border-[#2F7E6A] bg-emerald-100/70 scale-[1.01]'
                  : 'border-[#63C6A7] bg-white hover:bg-emerald-50/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="w-14 h-14 rounded-full bg-[#E9F7F2] flex items-center justify-center text-[#2F7E6A] shadow-xs border-2 border-[#BFE8D6]">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-black text-[#1F2E2C]">
                  Clique para selecionar da Galeria ou Arquivos
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ou arraste e solte o arquivo aqui (JPG, PNG ou WebP)
                </p>
              </div>
              <span className="px-4 py-2 bg-[#2F7E6A] text-white text-xs font-extrabold rounded-xl mt-1 shadow-xs flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Escolher Foto
              </span>
            </label>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: AVATARES PRONTOS                                      */}
        {/* ============================================================ */}
        {activeTab === 'preset' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600">
              Escolha um avatar representativo para seu perfil:
            </p>
            <div className="grid grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = photoPreview === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setPhotoPreview(avatar.url);
                      setSuccessMessage(`Avatar "${avatar.label}" selecionado! Clique em Salvar.`);
                      audioService.playClickSound();
                    }}
                    className={`group relative p-1 rounded-2xl border-2 transition flex flex-col items-center cursor-pointer ${
                      isSelected
                        ? 'border-[#2F7E6A] bg-emerald-100 shadow-md scale-105'
                        : 'border-transparent bg-white hover:border-[#63C6A7]'
                    }`}
                    title={avatar.label}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      className="w-14 h-14 rounded-full object-cover shadow-xs"
                    />
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-[#2F7E6A] text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <span className="text-[9px] font-bold text-[#1F2E2C] truncate max-w-full text-center mt-1">
                      {avatar.label.split('/')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: LINK DA WEB (URL)                                     */}
        {/* ============================================================ */}
        {activeTab === 'url' && (
          <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-[#BFE8D6]">
            <div>
              <label className="block text-xs font-black text-[#1F2E2C] uppercase mb-1">
                Link Direto da Imagem (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="flex-1 p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#2F7E6A] hover:bg-[#256555] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              Dica: Você pode usar links diretos do Google Fotos, Imgur, Unsplash ou qualquer servidor web.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-800 font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-[#BFE8D6]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="py-2.5 px-6 bg-[#2F7E6A] hover:bg-[#256555] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#63C6A7]" /> Salvar Foto de Perfil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
