import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../types';
import {
  User,
  Heart,
  Phone,
  AlertOctagon,
  FileText,
  MapPin,
  Calendar,
  Edit2,
  Check,
  Shield,
  Activity,
  Droplet,
} from 'lucide-react';

export const PatientManagement: React.FC = () => {
  const { patient, updatePatient } = useApp();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Patient>(patient);

  const [newAllergy, setNewAllergy] = useState('');
  const [newDisease, setNewDisease] = useState('');

  const userName = currentUser?.displayName || 'Administrador';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient(formData, userName);
    setIsEditing(false);
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, newAllergy.trim()] });
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (a: string) => {
    setFormData({ ...formData, allergies: formData.allergies.filter((x) => x !== a) });
  };

  const handleAddDisease = () => {
    if (newDisease.trim() && !formData.diseases.includes(newDisease.trim())) {
      setFormData({ ...formData, diseases: [...formData.diseases, newDisease.trim()] });
      setNewDisease('');
    }
  };

  const handleRemoveDisease = (d: string) => {
    setFormData({ ...formData, diseases: formData.diseases.filter((x) => x !== d) });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <User className="w-7 h-7 text-[#2F7E6A]" /> Cadastro e Ficha do Paciente
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Informações pessoais, alergias, contato de emergência e histórico de saúde
          </p>
        </div>

        {isAdmin && !isEditing && (
          <button
            onClick={() => { setFormData(patient); setIsEditing(true); }}
            className="px-5 py-3 bg-[#2F7E6A] hover:bg-[#256555] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition"
          >
            <Edit2 className="w-4 h-4" /> Editar Ficha do Paciente
          </button>
        )}
      </div>

      {!isEditing ? (
        /* Read-Only Profile View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Photo Card & Primary Contacts */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm text-center space-y-4">
            <img
              src={patient.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'}
              alt={patient.fullName}
              className="w-36 h-36 rounded-full mx-auto object-cover border-4 border-[#63C6A7] shadow-md"
            />

            <div>
              <h3 className="text-2xl font-black text-[#1F2E2C]">{patient.fullName}</h3>
              <p className="text-xs font-bold text-[#2F7E6A] mt-0.5">CPF: {patient.cpf}</p>
            </div>

            {/* Emergency Phone Highlight */}
            <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-2xl text-left space-y-1">
              <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
                <Phone className="w-4 h-4 animate-bounce" /> Contato de Emergência
              </span>
              <p className="text-lg font-black text-rose-800">{patient.emergencyPhone}</p>
            </div>

            <div className="text-xs text-left text-[#1F2E2C] space-y-2 pt-2 border-t border-gray-100">
              <p className="flex items-center gap-2 font-semibold">
                <Phone className="w-4 h-4 text-[#2F7E6A]" /> Telefone: <strong>{patient.phone}</strong>
              </p>
              <p className="flex items-start gap-2 font-semibold">
                <MapPin className="w-4 h-4 text-[#2F7E6A] shrink-0 mt-0.5" /> Endereço: <strong>{patient.address}</strong>
              </p>
            </div>
          </div>

          {/* Details & Medical Highlights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] text-center shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Tipo Sanguíneo</span>
                <span className="text-2xl font-black text-[#2F7E6A] flex items-center justify-center gap-1">
                  <Droplet className="w-5 h-5 fill-[#63C6A7]" /> {patient.bloodType}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] text-center shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Data Nasc.</span>
                <span className="text-base font-extrabold text-[#1F2E2C]">
                  {new Date(patient.birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] text-center shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Peso</span>
                <span className="text-xl font-extrabold text-[#1F2E2C]">{patient.weight} kg</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-[#BFE8D6] text-center shadow-xs">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Altura</span>
                <span className="text-xl font-extrabold text-[#1F2E2C]">{patient.height} m</span>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-2 mb-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" /> Alergias Registradas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-xs rounded-xl shadow-xs"
                    >
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="font-extrabold text-[#1F2E2C] text-sm flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-[#2F7E6A]" /> Condições Médicas / Doenças Crônicas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.diseases.map((d, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7] font-extrabold text-xs rounded-xl"
                    >
                      🩺 {d}
                    </span>
                  ))}
                </div>
              </div>

              {patient.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="font-bold text-gray-700 text-xs mb-1">Observações Médicas e de Cuidado:</h4>
                  <p className="text-xs text-[#1F2E2C] bg-[#E9F7F2] p-3 rounded-xl border border-[#BFE8D6]">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border-2 border-[#BFE8D6] shadow-md space-y-4">
          <h3 className="text-xl font-black text-[#1F2E2C] pb-2 border-b border-[#BFE8D6]">
            Editar Dados do Paciente
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">CPF *</label>
              <input
                type="text"
                required
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Data de Nascimento *</label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Telefone Principal</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">Telefone de Emergência *</label>
              <input
                type="text"
                required
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full p-2.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-sm font-bold text-rose-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Tipo Sanguíneo</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Altura (m)</label>
              <input
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2E2C] mb-1">URL da Foto</label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Endereço Completo</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-sm font-semibold"
            />
          </div>

          {/* Allergies & Diseases tags editor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">Alergias</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Nova alergia..."
                  className="p-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-xl"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.allergies.map((a, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    {a}
                    <button type="button" onClick={() => handleRemoveAllergy(a)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2F7E6A] mb-1">Doenças / Condições Crônicas</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  placeholder="Nova condição..."
                  className="p-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddDisease}
                  className="px-3 py-1 bg-[#2F7E6A] text-white font-bold text-xs rounded-xl"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.diseases.map((d, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#E9F7F2] text-[#2F7E6A] text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    {d}
                    <button type="button" onClick={() => handleRemoveDisease(d)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2E2C] mb-1">Observações Médicas Geral</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-[#E9F7F2] border-2 border-[#63C6A7] rounded-xl text-xs font-medium"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2F7E6A] text-white font-extrabold rounded-xl text-xs shadow-md"
            >
              Salvar Ficha do Paciente
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
