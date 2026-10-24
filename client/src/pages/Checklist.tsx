import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ChecklistItem, ChecklistStatus } from '../types/index.js';
import { 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  Activity,
  Edit3,
  FileCheck
} from 'lucide-react';

export const Checklist: React.FC = () => {
  const [data, setData] = useState<{
    overall_progress: number;
    total_items: number;
    completed_items: number;
    categories: Record<string, ChecklistItem[]>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editStatus, setEditStatus] = useState<ChecklistStatus>('PENDING');
  const [editEvidence, setEditEvidence] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const res = await api.getChecklist();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditingItem(item);
    setEditStatus(item.status);
    setEditEvidence(item.evidence_text || '');
    setEditAssigned(item.assigned_to || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editStatus === 'COMPLETED' && (!editEvidence || editEvidence.trim().length < 10)) {
      alert('Atenção: O estado COMPLETED exige evidência concreta de conclusão (mínimo de 10 caracteres explicativos).');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateChecklistItem(editingItem.id, {
        status: editStatus,
        evidence_text: editEvidence,
        assigned_to: editAssigned,
      });
      setEditingItem(null);
      loadChecklist();
    } catch (err: any) {
      alert(`Erro ao atualizar item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges: Record<ChecklistStatus, { bg: string; text: string; icon: any }> = {
    COMPLETED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    IN_PROGRESS: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: Clock },
    PENDING: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', icon: Clock },
    BLOCKED: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', icon: AlertTriangle },
    FAILED: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: AlertCircle },
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Overall Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-brand-500" />
            <span>Checklist de Implantação e Prontidão</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            18 categorias canônicas auditáveis. Conclusão exige evidência rastreável.
          </p>
        </div>

        {data && (
          <div className="glass-panel px-5 py-3 rounded-xl flex items-center gap-4 self-start sm:self-auto">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Progresso Geral</div>
              <div className="text-xl font-extrabold text-white flex items-baseline gap-1.5">
                <span className="text-brand-400">{data.overall_progress}%</span>
                <span className="text-xs text-slate-400">({data.completed_items}/{data.total_items} concluídos)</span>
              </div>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-brand-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${data.overall_progress}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      {loading || !data ? (
        <div className="flex items-center justify-center p-12">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(data.categories).map(([category, items]) => {
            const completedCount = items.filter(i => i.status === 'COMPLETED').length;
            const catProgress = Math.round((completedCount / items.length) * 100);

            return (
              <div key={category} className="glass-panel rounded-xl overflow-hidden border border-slate-800/80">
                {/* Category Header */}
                <div className="bg-surface-850 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{category}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {completedCount}/{items.length} itens
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">{catProgress}%</span>
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${catProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-800/60">
                  {items.map(item => {
                    const badge = statusBadges[item.status] || statusBadges.PENDING;
                    const StatusIcon = badge.icon;

                    return (
                      <div key={item.id} className="p-4 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{item.status}</span>
                            </span>
                          </div>
                          <p className="text-slate-400">{item.description}</p>
                          <div className="p-2.5 rounded bg-surface-950/80 border border-slate-800/60 text-[11px] text-slate-300">
                            <span className="font-semibold text-slate-400 block mb-0.5">Critério de Aceite:</span>
                            {item.acceptance_criteria}
                          </div>

                          {item.evidence_text ? (
                            <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300 flex items-start gap-2">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block text-emerald-400">Evidência Comprovada:</span>
                                {item.evidence_text}
                              </div>
                            </div>
                          ) : item.status === 'COMPLETED' ? (
                            <span className="text-rose-400 font-semibold italic text-[10px]">
                              Aviso: Item marcado como concluído sem evidência anexada.
                            </span>
                          ) : null}
                        </div>

                        <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                          <div className="text-right text-[11px] text-slate-400">
                            <div>Resp: <span className="text-slate-200">{item.assigned_to || 'Não atribuído'}</span></div>
                            <div className="font-mono text-[10px] text-slate-400">{new Date(item.updated_at).toLocaleDateString('pt-BR')}</div>
                          </div>
                          <button
                            onClick={() => openEditModal(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Atualizar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Atualização de Item com Evidência */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-500" />
                <span>Atualizar Item do Checklist</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Item:</span>
                <p className="text-white font-medium text-sm mt-0.5">{editingItem.title}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Critério de Aceite:</span>
                <p className="text-slate-300 mt-0.5 p-2 rounded bg-surface-950 border border-slate-800">
                  {editingItem.acceptance_criteria}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status *</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as ChecklistStatus)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                  >
                    <option value="PENDING">PENDING (Pendente)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Em Andamento)</option>
                    <option value="BLOCKED">BLOCKED (Bloqueado)</option>
                    <option value="FAILED">FAILED (Falha)</option>
                    <option value="COMPLETED">COMPLETED (Concluído)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Responsável</label>
                  <input
                    type="text"
                    value={editAssigned}
                    onChange={e => setEditAssigned(e.target.value)}
                    placeholder="Ex: AppSec Lead"
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Evidência Concreta de Conclusão {editStatus === 'COMPLETED' ? '*' : '(Opcional)'}</span>
                  {editStatus === 'COMPLETED' && (
                    <span className="text-[10px] text-amber-400 font-normal">Obrigatória para status COMPLETED</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={editEvidence}
                  onChange={e => setEditEvidence(e.target.value)}
                  placeholder="Descreva a comprovação técnica auditável (logs, hashes, commit, testes de regressão)..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Atualização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
