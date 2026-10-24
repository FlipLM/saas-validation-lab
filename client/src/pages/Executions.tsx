import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ExecutionJob, Project } from '../types/index.js';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Ban, 
  Activity,
  Plus,
  Bot
} from 'lucide-react';

export const Executions: React.FC = () => {
  const [jobs, setJobs] = useState<ExecutionJob[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Trigger Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('Web Recon Agent');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Polling suave a cada 4s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [jobsData, projectsData] = await Promise.all([
        api.listExecutions(),
        api.listProjects(),
      ]);
      setJobs(jobsData);
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja cancelar esta execução?')) return;
    try {
      await api.cancelJob(id, 'Cancelado manualmente pelo operador no painel');
      loadData();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Selecione um projeto');
      return;
    }
    try {
      setSubmitting(true);
      await api.triggerExecution({
        project_id: selectedProjectId,
        agent_id: selectedAgentId,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Erro ao enfileirar job: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges: Record<string, { bg: string; text: string; icon: any }> = {
    RUNNING: { bg: 'bg-emerald-500/10 border-emerald-500/20 animate-pulse', text: 'text-emerald-400', icon: Activity },
    QUEUED: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', icon: Clock },
    SUCCEEDED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    FAILED: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', icon: XCircle },
    WAITING_APPROVAL: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
    WAITING_DEPENDENCY: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: Clock },
    CANCELLED: { bg: 'bg-slate-700/20 border-slate-700/40', text: 'text-slate-400', icon: Ban },
    BLOCKED: { bg: 'bg-rose-900/20 border-rose-900/40', text: 'text-rose-400', icon: AlertTriangle },
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PlayCircle className="w-6 h-6 text-brand-500" />
            <span>Fila Persistente e Execuções dos Workers</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe jobs em tempo real, heartbeats de workers e recuperação autônoma de falhas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Disparar Execução</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center space-y-3">
          <PlayCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Fila de execução vazia</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Nenhuma tarefa ou agente em execução no momento. Dispare uma execução ou ative tarefas no Kanban.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Disparar Execução de Teste
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-850 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">ID / Job</th>
                  <th className="p-3.5">Agente</th>
                  <th className="p-3.5">Projeto Alvo</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Tentativas</th>
                  <th className="p-3.5">Criado em</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {jobs.map(job => {
                  const badge = statusBadges[job.status] || { bg: 'bg-slate-800', text: 'text-slate-400', icon: Clock };
                  const StatusIcon = badge.icon;

                  return (
                    <tr key={job.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white text-xs font-sans truncate max-w-[180px]">
                          {job.task_title || job.agent_id}
                        </div>
                        <span className="text-[10px] text-slate-400">{job.id.substring(0, 8)}...</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <Bot className="w-3.5 h-3.5 text-brand-400" />
                          <span>{job.agent_id}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-sans text-slate-300">{job.project_name || 'N/A'}</td>
                      <td className="p-3.5 font-sans">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{job.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-200">{job.attempts}</span>
                        <span className="text-slate-400">/{job.max_retries || 3}</span>
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {new Date(job.created_at).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        {['RUNNING', 'QUEUED', 'RETRY_PENDING'].includes(job.status) && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/20 text-xs transition"
                            title="Cancelar execução"
                          >
                            Cancelar
                          </button>
                        )}
                        {job.error_message && (
                          <span className="text-[10px] text-rose-400 block truncate max-w-[150px]" title={job.error_message}>
                            {job.error_message}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Disparar Execução */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-brand-500" />
                <span>Disparar Execução Autônoma</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTrigger} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Projeto Alvo *</label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.target_url})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agente Especializado *</label>
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                >
                  <option value="Product Discovery Agent">Product Discovery Agent</option>
                  <option value="Web Recon Agent">Web Recon Agent</option>
                  <option value="QA, Security & Reliability Agent">QA, Security & Reliability Agent</option>
                  <option value="Code & Architecture Auditor">Code & Architecture Auditor</option>
                  <option value="UX Recon Agent">UX Recon Agent</option>
                  <option value="Legal Research Analyst">Legal Research Analyst</option>
                  <option value="Legal & Privacy Compliance Auditor">Legal & Privacy Compliance Auditor</option>
                  <option value="Competitive Intelligence Agent">Competitive Intelligence Agent</option>
                  <option value="Market & Growth Agent">Market & Growth Agent</option>
                  <option value="Product Validation & Release Readiness Agent">Product Validation & Release Readiness</option>
                  <option value="Independent Evidence Validator">Independent Evidence Validator</option>
                </select>
              </div>

              <div className="p-3 rounded bg-surface-950 border border-slate-800 text-[11px] text-slate-400">
                O job será inserido na fila transacional do SQLite com lock ACID e consumido pelo worker autônomo.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Enfileirando...' : 'Enfileirar Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
