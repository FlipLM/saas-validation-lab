import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { DashboardStats } from '../types/index.js';
import { 
  ShieldAlert, 
  Layers, 
  CheckSquare, 
  PlayCircle, 
  AlertTriangle, 
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Radio
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-slate-400">Carregando métricas reais do sistema...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Falha na comunicação com o backend</p>
            <p className="text-xs text-rose-400/80">{error}</p>
          </div>
          <button onClick={loadStats} className="ml-auto px-3 py-1 bg-rose-500/20 rounded text-xs hover:bg-rose-500/30">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Centro de Validação SaaS</h2>
          <p className="text-sm text-slate-400 mt-1">
            Auditoria autônoma, segurança ofensiva autorizada, integridade de evidências e pesquisa jurídica.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('live-agents')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-sm font-semibold transition"
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Raciocínio ao Vivo</span>
          </button>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 transition"
          >
            <Layers className="w-4 h-4" />
            <span>Gerenciar Projetos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Projetos */}
        <div 
          onClick={() => onNavigate('projects')}
          className="glass-card p-5 rounded-xl cursor-pointer transition hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Projetos SaaS</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.projects.total}</span>
            <span className="text-xs text-blue-400 font-medium">({stats.projects.in_audit} em auditoria)</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Bloqueados: {stats.projects.blocked}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </p>
        </div>

        {/* Card 2: Tarefas Kanban */}
        <div 
          onClick={() => onNavigate('kanban')}
          className="glass-card p-5 rounded-xl cursor-pointer transition hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tarefas no Kanban</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {(stats.tasks.TODO || 0) + (stats.tasks.IN_PROGRESS || 0)}
            </span>
            <span className="text-xs text-purple-400 font-medium">em andamento / a fazer</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Concluídas: {stats.tasks.DONE || 0}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </p>
        </div>

        {/* Card 3: Vulnerabilidades */}
        <div 
          onClick={() => onNavigate('reports')}
          className="glass-card p-5 rounded-xl cursor-pointer transition hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vulnerabilidades</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {stats.findings.confirmed_vulnerabilities}
            </span>
            <span className="text-xs text-slate-400">confirmadas</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Total de achados: {stats.findings.total}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </p>
        </div>

        {/* Card 4: Checklist */}
        <div 
          onClick={() => onNavigate('checklist')}
          className="glass-card p-5 rounded-xl cursor-pointer transition hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Checklist Auditado</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{stats.checklist.progress_percent}%</span>
            <span className="text-xs text-slate-400 font-medium">({stats.checklist.completed}/{stats.checklist.total} itens)</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${stats.checklist.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Descobertas por Severidade & Central de Integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Descobertas por Severidade */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Descobertas por Severidade</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Classificação Canônica</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'CRITICAL', color: 'bg-rose-600', text: 'text-rose-400', count: stats.findings.by_severity.CRITICAL || 0 },
              { label: 'HIGH', color: 'bg-orange-500', text: 'text-orange-400', count: stats.findings.by_severity.HIGH || 0 },
              { label: 'MEDIUM', color: 'bg-amber-500', text: 'text-amber-400', count: stats.findings.by_severity.MEDIUM || 0 },
              { label: 'LOW', color: 'bg-blue-500', text: 'text-blue-400', count: stats.findings.by_severity.LOW || 0 },
              { label: 'INFO', color: 'bg-slate-500', text: 'text-slate-400', count: stats.findings.by_severity.INFO || 0 },
            ].map(sev => (
              <div key={sev.label} className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${sev.text} w-20`}>{sev.label}</span>
                <div className="flex-1 mx-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${sev.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(sev.count * 20, 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-white w-8 text-right">{sev.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status de Integrações e Infraestrutura */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-400" />
              <span>Integrações Externas Reais</span>
            </h3>
            <button 
              onClick={() => onNavigate('integrations')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {stats.integrations.map(integ => {
              const statusColors: Record<string, string> = {
                TESTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                TESTING: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
                CONFIGURED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                BLOCKED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                NOT_CONFIGURED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                DISABLED: 'bg-slate-700/20 text-slate-500 border-slate-700/40',
              };

              return (
                <div key={integ.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{integ.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">ID: {integ.id}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[integ.status] || statusColors.NOT_CONFIGURED}`}>
                    {integ.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Politica: Credenciais mascaradas por padrão
            </span>
            <span className="font-mono text-[11px]">RFC 9111 compliant</span>
          </div>
        </div>
      </div>

      {/* Tarefas Recentes do Orquestrador */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Últimas Tarefas Atualizadas</span>
          </h3>
          <button 
            onClick={() => onNavigate('kanban')}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            <span>Ver Kanban Completo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {stats.recent_tasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhuma tarefa cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2.5">Título</th>
                  <th className="pb-2.5">Projeto</th>
                  <th className="pb-2.5">Categoria</th>
                  <th className="pb-2.5">Prioridade</th>
                  <th className="pb-2.5">Coluna</th>
                  <th className="pb-2.5">Última Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats.recent_tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 font-medium text-white">{task.title}</td>
                    <td className="py-2.5 text-slate-400">{task.project_name || 'N/A'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {task.category}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`font-semibold ${
                        task.priority === 'CRITICAL' ? 'text-rose-400' :
                        task.priority === 'HIGH' ? 'text-orange-400' :
                        task.priority === 'MEDIUM' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-semibold">
                        {task.column}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{new Date(task.updated_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
