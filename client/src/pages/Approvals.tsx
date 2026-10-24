import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Approval } from '../types/index.js';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Activity
} from 'lucide-react';

export const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await api.listApprovals();
      setApprovals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED' | 'POSTPONED') => {
    const notes = prompt(`Insira uma observação ou justificativa para a decisão [${decision}]:`);
    if (notes === null) return; // cancelado pelo operador

    try {
      setDecidingId(id);
      await api.decideApproval(id, decision, notes);
      loadApprovals();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setDecidingId(null);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const pastApprovals = approvals.filter(a => a.status !== 'PENDING');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            <span>Central de Aprovações e Segurança Operacional</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Controle humano obrigatório para testes invasivos, ações com risco de dados e custos externos.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-900 border border-slate-800 text-xs text-slate-300">
          <span className="font-semibold text-rose-400">{pendingApprovals.length}</span>
          <span>pendência(s) aguardando deliberação</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pendentes */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Solicitações Pendentes ({pendingApprovals.length})</span>
            </h3>

            {pendingApprovals.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl text-center text-xs text-slate-400">
                Nenhuma operação de alto risco pendente de aprovação humana no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingApprovals.map(appr => (
                  <div key={appr.id} className="glass-panel p-5 rounded-xl border border-amber-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Risco Elevado
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {appr.project_name || 'Projeto Geral'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">
                          {appr.task_title || appr.operation_type}
                        </h4>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDecision(appr.id, 'APPROVED')}
                          disabled={decidingId === appr.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={() => handleDecision(appr.id, 'REJECTED')}
                          disabled={decidingId === appr.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Escopo Solicitado:</span>
                        <p className="text-slate-200 font-mono text-[11px] break-all">{appr.scope_requested}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-950/80 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Avaliação de Risco:</span>
                        <p className="text-rose-300/90">{appr.risk_assessment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de Decisões */}
          {pastApprovals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Histórico de Deliberações ({pastApprovals.length})</span>
              </h3>

              <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-850 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Operação / Tarefa</th>
                      <th className="p-3.5">Decisão</th>
                      <th className="p-3.5">Operador</th>
                      <th className="p-3.5">Justificativa</th>
                      <th className="p-3.5">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {pastApprovals.map(appr => (
                      <tr key={appr.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3.5 font-medium text-white">{appr.task_title || appr.operation_type}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appr.status === 'APPROVED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {appr.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">{appr.decided_by || 'Operador'}</td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate">{appr.decision_notes || '—'}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {appr.decided_at ? new Date(appr.decided_at).toLocaleString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
