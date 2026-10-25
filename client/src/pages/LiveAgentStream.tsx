import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api.js';
import { AgentActivity, Project } from '../types/index.js';
import { 
  Radio, 
  Brain, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Play, 
  Copy, 
  Check, 
  Filter, 
  Sparkles, 
  Bot, 
  Terminal, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const LiveAgentStream: React.FC = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString('pt-BR'));

  const streamEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Carrega projetos
  useEffect(() => {
    api.listProjects().then(projs => {
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    }).catch(console.error);
  }, []);

  // 2. Conecta ao Stream SSE ou executa Polling
  useEffect(() => {
    if (!isLive) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      return;
    }

    let url = '/api/agents/stream';
    if (selectedProjectId) {
      url += `?projectId=${selectedProjectId}`;
    }

    // Tenta conectar via SSE
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setLastHeartbeat(new Date().toLocaleTimeString('pt-BR'));
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLastHeartbeat(new Date().toLocaleTimeString('pt-BR'));

        if (payload.type === 'ACTIVITY' && payload.data) {
          const act: AgentActivity = payload.data;
          setActivities(prev => {
            // Evita duplicatas
            if (prev.some(a => a.id === act.id)) return prev;
            return [act, ...prev].slice(0, 100);
          });
          setEventCount(c => c + 1);
        }
      } catch (err) {
        console.warn('Erro ao decodificar evento SSE:', err);
      }
    };

    es.onerror = () => {
      // Fallback para polling a cada 3s se SSE fechar
      api.listAgentActivities({
        projectId: selectedProjectId || undefined,
        limit: 50
      }).then(list => {
        setActivities(list);
        setLastHeartbeat(new Date().toLocaleTimeString('pt-BR'));
      }).catch(console.error);
    };

    // Polling de garantia a cada 6s
    const pollInterval = setInterval(() => {
      api.listAgentActivities({
        projectId: selectedProjectId || undefined,
        limit: 50
      }).then(list => {
        setActivities(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = list.filter(l => !existingIds.has(l.id));
          if (newItems.length > 0) {
            return [...newItems, ...prev].slice(0, 100);
          }
          return prev;
        });
        setLastHeartbeat(new Date().toLocaleTimeString('pt-BR'));
      }).catch(console.error);
    }, 5000);

    return () => {
      es.close();
      clearInterval(pollInterval);
    };
  }, [isLive, selectedProjectId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredActivities = activities.filter(act => {
    if (selectedAgent !== 'ALL' && !act.agent_id.toLowerCase().includes(selectedAgent.toLowerCase())) {
      return false;
    }
    if (stageFilter !== 'ALL' && act.stage !== stageFilter) {
      return false;
    }
    return true;
  });

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'THINKING':
        return {
          label: '🧠 PENSAMENTO (REASONING)',
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: Brain
        };
      case 'ANALYZING':
        return {
          label: '🔍 ANÁLISE DE CONTEXTO',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: Terminal
        };
      case 'PRODUCING':
        return {
          label: '⚡ PRODUZINDO CÓDIGO',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: Code2
        };
      case 'VALIDATING':
        return {
          label: '🛡️ VALIDAÇÃO DE EVIDÊNCIA',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: ShieldCheck
        };
      case 'COMPLETED':
        return {
          label: '✅ CONCLUSÃO TÉCNICA',
          bg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
          icon: CheckCircle2
        };
      case 'ESCALATED':
        return {
          label: '🤖 ESCALADA ANTIGRAVITY',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse',
          icon: AlertTriangle
        };
      default:
        return {
          label: stage,
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          icon: Bot
        };
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header com Status ao Vivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span>Raciocínio & Produção dos Agentes em Tempo Real</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE SSE STREAM</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Observe passo a passo a cadeia de pensamento (chain-of-thought), os diagnósticos e os patches de código gerados por cada agente autônomo.
          </p>
        </div>

        {/* Controles Globais */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Último Batimento</span>
            <span className="text-xs font-mono text-slate-300">{lastHeartbeat}</span>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
              isLive 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isLive ? <><Pause className="w-3.5 h-3.5" /> Pausar Feed</> : <><Play className="w-3.5 h-3.5" /> Retomar Feed</>}
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Seleção */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Projeto */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-surface-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Agente */}
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className="bg-surface-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Todos os Agentes</option>
              <option value="Hermes">Agente Hermes (Reparação & Orquestração)</option>
              <option value="Product Discovery">Product Discovery Agent</option>
              <option value="Web Recon">Web Recon Agent</option>
              <option value="QA, Security">QA, Security & Reliability Agent</option>
              <option value="Code & Architecture">Code & Architecture Auditor</option>
              <option value="Legal">Legal & Privacy Compliance</option>
              <option value="Independent Evidence Validator">Validador Independente</option>
            </select>
          </div>

          {/* Etapa */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-surface-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Todas as Etapas</option>
              <option value="THINKING">🧠 Pensamento (Reasoning)</option>
              <option value="PRODUCING">⚡ Produção de Código</option>
              <option value="VALIDATING">🛡️ Validação de Evidência</option>
              <option value="COMPLETED">✅ Concluídos</option>
              <option value="ESCALATED">🤖 Escaladas para Antigravity</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          <span>Exibindo </span>
          <span className="text-white font-bold">{filteredActivities.length}</span>
          <span> eventos registrados</span>
        </div>
      </div>

      {/* Feed ao Vivo em Timeline */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <Brain className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-white">Aguardando Atividade dos Agentes</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Assim que uma tarefa for capturada pelo Orquestrador ou Agente Hermes, o raciocínio em tempo real e os códigos gerados aparecerão aqui instantaneamente.
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const badge = getStageBadge(act.stage);
            const BadgeIcon = badge.icon;

            return (
              <div 
                key={act.id} 
                className="glass-panel rounded-2xl border border-slate-800/90 hover:border-slate-700 transition overflow-hidden shadow-xl"
              >
                {/* Cabeçalho do Card */}
                <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-950 border border-slate-700/80 flex items-center justify-center text-brand-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{act.agent_id}</span>
                        {act.task_title && (
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            • Tarefa: <strong className="text-slate-200">{act.task_title}</strong>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(act.created_at).toLocaleTimeString('pt-BR')} • {act.project_name || 'FisioteraHub'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {act.model_used && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                        {act.model_used}
                      </span>
                    )}

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Conteúdo Principal: Pensamento & Produção */}
                <div className="p-5 space-y-4">
                  {/* Bloco 1: O que o Agente está Pensando (Reasoning / Hipótese) */}
                  {act.thought && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        <span>Cadeia de Raciocínio & Diagnóstico Técnico:</span>
                      </div>
                      <div className="bg-surface-950/80 border border-purple-500/20 rounded-xl p-3.5 font-mono text-xs text-purple-200/90 leading-relaxed whitespace-pre-wrap">
                        {act.thought}
                      </div>
                    </div>
                  )}

                  {/* Bloco 2: O que o Agente está Produzindo (Patch de Código / JSON / Solução) */}
                  {act.output_produced && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Solução Técnica & Patch Cirúrgico Produzido:</span>
                        </div>
                        <button
                          onClick={() => handleCopy(act.output_produced || '', act.id)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-surface-950 border border-slate-700 hover:border-slate-600 text-slate-300 flex items-center gap-1.5 transition"
                        >
                          {copiedId === act.id ? (
                            <><Check className="w-3 h-3 text-emerald-400" /> Copiado!</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copiar Código</>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
                        <pre>{act.output_produced}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={streamEndRef} />
      </div>
    </div>
  );
};
