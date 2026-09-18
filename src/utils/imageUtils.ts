/**
 * Image processing utilities for profile photos
 */

export interface PresetAvatar {
  id: string;
  label: string;
  url: string;
  category: 'paciente' | 'cuidador' | 'medico' | 'responsavel' | 'geral';
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar_senhora_1',
    label: 'Dona Francisca / Senhora Elegante',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=crop&q=80',
    category: 'paciente',
  },
  {
    id: 'avatar_senhora_2',
    label: 'Dona Alzira / Senhora Sorridente',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&fit=crop&q=80',
    category: 'paciente',
  },
  {
    id: 'avatar_senhor_1',
    label: 'Seu Antônio / Senhor Grisalho',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&q=80',
    category: 'paciente',
  },
  {
    id: 'avatar_senhor_2',
    label: 'Seu Carlos / Senhor Óculos',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&q=80',
    category: 'paciente',
  },
  {
    id: 'avatar_cuidadora_1',
    label: 'Irani / Cuidadora Profissional',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop&q=80',
    category: 'cuidador',
  },
  {
    id: 'avatar_cuidador_1',
    label: 'João / Cuidador Atencioso',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80',
    category: 'cuidador',
  },
  {
    id: 'avatar_adm_juliett',
    label: 'Juliett Souza / Gestora Clínica',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&fit=crop&q=80',
    category: 'geral',
  },
  {
    id: 'avatar_medica',
    label: 'Dra. Ana / Médica Clínica',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&fit=crop&q=80',
    category: 'medico',
  },
  {
    id: 'avatar_responsavel_1',
    label: 'Maria / Filha Responsável',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
    category: 'responsavel',
  },
  {
    id: 'avatar_responsavel_2',
    label: 'Lucas / Familiar Responsável',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&fit=crop&q=80',
    category: 'responsavel',
  },
];

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&fit=crop&q=80';

/**
 * Resizes and compresses an image file to a lightweight Base64 JPEG data URL.
 * Ensures the image fits comfortably in local storage / Firestore.
 */
export function compressImageFile(file: File, maxSize = 300, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado deve ser uma imagem (JPG, PNG, WEBP, etc.).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Erro ao decodificar a imagem selecionada.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
