import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActionType } from '../types';
import {
  History as HistoryIcon,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  UserCheck,
} from 'lucide-react';

export const AuditHistory: React.FC = () => {
  const { historyLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filteredLogs = historyLogs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.actionType === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'administracao':
        return <span className="px-2.5 py-0.5 bg-[#E9F7F2] text-[#2F7E6A] border border-[#63C6A7] font-extrabold text-[11px] rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Dose Administrada</span>;
      case 'medicamento_esquecido':
        return <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-300 font-extrabold text-[11px] rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Dose Não Administrada</span>;
      case 'cadastro':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-[11px] rounded-full flex items-center gap-1"><PlusCircle className="w-3.5 h-3.5" /> Novo Cadastro</span>;
      case 'alteracao':
      case 'troca_horario':
      case 'troca_dose':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[11px] rounded-full flex items-center gap-1"><Edit className="w-3.5 h-3.5" /> Alteração</span>;
      case 'exclusao':
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 font-extrabold text-[11px] rounded-full flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Exclusão</span>;
      case 'mudanca_responsavel':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[11px] rounded-full flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Mudança de Plantão</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 font-bold text-[11px] rounded-full">Registro</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#E9F7F2] p-6 rounded-3xl border-3 border-[#63C6A7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1F2E2C] flex items-center gap-2">
            <HistoryIcon className="w-7 h-7 text-[#2F7E6A]" /> Histórico Permanente e Auditável
          </h2>
          <p className="text-xs text-[#2F7E6A] font-semibold mt-1">
            Registro imutável de todas as administrações, alterações, cadastros e trocas de responsável (Nunca apagados)
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2F7E6A] text-white rounded-2xl text-xs font-black shadow-sm shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#BFE8D6]" /> Trilha de Auditoria Gravada no Firebase
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-[#BFE8D6] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário ou descrição..."
            className="w-full pl-9 pr-3 py-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs font-semibold text-[#1F2E2C]"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#2F7E6A]" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="p-2 bg-[#E9F7F2] border border-[#63C6A7] rounded-xl text-xs font-bold text-[#1F2E2C] flex-1 sm:flex-initial"
          >
            <option value="all">Todas as Ações</option>
            <option value="administracao">Administração de Doses</option>
            <option value="medicamento_esquecido">Medicamentos Esquecidos</option>
            <option value="cadastro">Cadastros</option>
            <option value="alteracao">Alterações</option>
            <option value="mudanca_responsavel">Troca de Responsável</option>
            <option value="exclusao">Exclusões</option>
          </select>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#BFE8D6] shadow-sm space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-medium text-sm">
            Nenhum registro encontrado no histórico.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl border border-[#BFE8D6] bg-[#E9F7F2]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#E9F7F2]/80 transition"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getActionBadge(log.actionType)}
                  <span className="text-xs font-extrabold text-[#1F2E2C]">{log.userName}</span>
                </div>
                <p className="text-xs font-semibold text-[#1F2E2C]">{log.description}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-[#2F7E6A] flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
