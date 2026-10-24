import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { 
  Activity, 
  Database, 
  Server, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCw
} from 'lucide-react';

export const Diagnostics: React.FC = () => {
  const [diag, setDiag] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setRefreshing(true);
      const data = await api.getDiagnostics();
      setDiag(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading && !diag) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-brand-500" />
            <span>Diagnóstico & Observabilidade do Sistema</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Métricas reais em tempo de execução: persistência, latência, workers, memória e saúde das integrações.
          </p>
        </div>

        <button
          onClick={loadDiagnostics}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
          <span>Verificar Novamente</span>
        </button>
      </div>

      {diag && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Status Geral: {diag.status}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                    Uptime: {Math.floor(diag.uptime_seconds / 60)}m {diag.uptime_seconds % 60}s
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificação executada em {new Date(diag.timestamp).toLocaleString('pt-BR')} (Latência: {diag.diagnostics_latency_ms}ms)
                </p>
              </div>
            </div>
          </div>

          {/* Grid of Diagnostics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Banco de Dados */}
            <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persistência</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{diag.database.status}</span>
                  <span className="text-xs text-emerald-400 font-mono">({diag.database.latency_ms}ms)</span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">{diag.database.driver}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Integridade referencial e modo WAL ativado sem locks bloqueantes.
              </div>
            </div>

            {/* Worker & Fila */}
            <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workers & Fila</span>
                <Server className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{diag.worker.status}</span>
                  <span className="text-xs text-purple-400 font-mono">({diag.worker.active_jobs} ativos)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Jobs na fila: <strong className="text-white font-mono">{diag.worker.queued_jobs}</strong> | Falhas: <strong className="text-rose-400 font-mono">{diag.worker.failed_jobs}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono truncate">
                Heartbeat: {diag.worker.last_heartbeat}
              </div>
            </div>

            {/* Recursos do Host */}
            <div className="glass-panel p-5 rounded-xl space-y-3 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos Host</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white flex items-center gap-2">
                  <span>RAM: {diag.host_system.memory_usage_percent}%</span>
                  <span className="text-xs text-blue-400 font-mono">({diag.host_system.cpus} CPUs)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">Node: {diag.host_system.node_version} ({diag.host_system.platform})</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Capacidade adequada para concorrência de workers locais.
              </div>
            </div>
          </div>

          {/* Histórico Recente de Execuções */}
          <div className="glass-panel p-6 rounded-xl space-y-4 border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Histórico Operacional de Sucessos e Falhas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Última Execução Bem-Sucedida:
                </span>
                {diag.history.last_success ? (
                  <div className="font-mono text-slate-300 space-y-1">
                    <p>Agente: {diag.history.last_success.agent_id}</p>
                    <p>Concluído em: {new Date(diag.history.last_success.finished_at).toLocaleString('pt-BR')}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma execução finalizada ainda.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-2">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  Última Falha Registrada:
                </span>
                {diag.history.last_failure ? (
                  <div className="font-mono text-slate-300 space-y-1">
                    <p>Agente: {diag.history.last_failure.agent_id}</p>
                    <p className="text-rose-400 text-[11px]">{diag.history.last_failure.error_message}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Nenhuma falha crítica registrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
