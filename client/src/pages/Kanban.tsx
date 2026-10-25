import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Task, TaskColumn, Project } from '../types/index.js';
import { 
  Kanban as KanbanIcon, 
  Plus, 
  Filter, 
  AlertTriangle, 
  AlertCircle,
  Activity,
  Layers
} from 'lucide-react';

const COLUMNS: { id: TaskColumn; label: string; color: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-700 bg-slate-900/40 text-slate-400' },
  { id: 'TODO', label: 'A Fazer', color: 'border-blue-900/60 bg-blue-950/20 text-blue-400' },
  { id: 'IN_PROGRESS', label: 'Em Andamento', color: 'border-amber-900/60 bg-amber-950/20 text-amber-400' },
  { id: 'IN_REVIEW', label: 'Em Revisão', color: 'border-purple-900/60 bg-purple-950/20 text-purple-400' },
  { id: 'BLOCKED', label: 'Bloqueado', color: 'border-rose-900/60 bg-rose-950/20 text-rose-400' },
  { id: 'DONE', label: 'Concluído', color: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-400' },
];

export const Kanban: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterAntigravity, setFilterAntigravity] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    project_id: '',
    title: '',
    description: '',
    category: 'PRODUCT' as any,
    priority: 'MEDIUM' as any,
    risk_level: 'LOW' as any,
    requires_approval: false,
    acceptance_criteria: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProjectId, selectedCategory]);

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
        setNewTask(prev => ({ ...prev, project_id: data[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.listTasks({
        projectId: selectedProjectId || undefined,
        category: selectedCategory || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (taskId: string, targetCol: TaskColumn) => {
    try {
      await api.moveTask(taskId, targetCol);
      loadTasks();
    } catch (err: any) {
      alert(`Bloqueio de movimentação: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.project_id) {
      alert('Selecione um projeto válido');
      return;
    }
    try {
      setSubmitting(true);
      const criteria = newTask.acceptance_criteria
        ? newTask.acceptance_criteria.split('\n').map(c => c.trim()).filter(Boolean)
        : [];

      await api.createTask({
        project_id: newTask.project_id,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        risk_level: newTask.risk_level,
        requires_approval: newTask.requires_approval ? 1 : 0,
        acceptance_criteria: JSON.stringify(criteria) as any,
      });

      setIsModalOpen(false);
      setNewTask({
        project_id: selectedProjectId || projects[0]?.id || '',
        title: '',
        description: '',
        category: 'PRODUCT',
        priority: 'MEDIUM',
        risk_level: 'LOW',
        requires_approval: false,
        acceptance_criteria: '',
      });
      loadTasks();
    } catch (err: any) {
      alert(`Erro ao criar tarefa: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <KanbanIcon className="w-6 h-6 text-brand-500" />
            <span>Kanban Inteligente</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Persistência em banco de dados, resolução de dependências e controle de aprovações.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="">Todas as Categorias</option>
              <option value="SECURITY">Segurança</option>
              <option value="ARCHITECTURE">Arquitetura</option>
              <option value="QA">Qualidade / QA</option>
              <option value="UX">UX / Usabilidade</option>
              <option value="LEGAL">Jurídico / LGPD</option>
              <option value="GROWTH">Crescimento</option>
              <option value="PRODUCT">Produto</option>
            </select>
          </div>

          {/* Antigravity Filter Toggle */}
          <button
            onClick={() => setFilterAntigravity(!filterAntigravity)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              filterAntigravity
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-900 border-purple-500/30 text-purple-300 hover:border-purple-500/60'
            }`}
          >
            <span>🤖</span>
            <span>Apenas Antigravity ({tasks.filter(t => t.assigned_agent?.includes('Antigravity')).length})</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Kanban Board (Horizontal Scrolling Columns) */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => {
              if (t.column !== col.id) return false;
              if (filterAntigravity) return t.assigned_agent?.includes('Antigravity');
              return true;
            });

            return (
              <div 
                key={col.id} 
                className="flex flex-col bg-surface-900/60 rounded-xl border border-slate-800/80 min-w-[240px] max-h-full"
              >
                {/* Column Header */}
                <div className={`p-3 border-b flex items-center justify-between rounded-t-xl ${col.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-white font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">
                      Nenhuma tarefa nesta coluna
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const priorityColors: Record<string, string> = {
                        CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                        HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                        MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        LOW: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      };

                      return (
                        <div 
                          key={task.id}
                          className="glass-card p-3 rounded-lg space-y-2.5 text-xs hover:border-slate-600 transition"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                              {task.category}
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-100 text-xs leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                          )}

                          {/* Alertas de Dependência e Aprovação */}
                          <div className="space-y-1">
                            {task.requires_approval === 1 && (
                              <div className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Requer Aprovação Humana</span>
                              </div>
                            )}
                            {(task.dependencies_pending || 0) > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{task.dependencies_pending} dependência(s) pendente(s)</span>
                              </div>
                            )}
                          </div>

                          {/* Destaque para Tarefas Escaladas ao Antigravity */}
                          {task.assigned_agent?.includes('Antigravity') && (
                            <div className="p-2 rounded bg-purple-950/70 border border-purple-500/40 text-[10px] space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between text-purple-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span>🤖</span>
                                  <span>Escalada para o Antigravity</span>
                                </span>
                              </div>
                              <p className="text-purple-200/80 text-[10px] leading-tight">
                                Tarefa com alta complexidade ou cota de tokens do OpenRouter excedida.
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const text = `Antigravity, execute a tarefa #${task.id}: "${task.title}".\nContexto: ${task.description || ''}`;
                                  navigator.clipboard.writeText(text);
                                  alert('Instrução copiada! Cole no chat do Antigravity no seu computador para eu realizar a alteração de código.');
                                }}
                                className="w-full py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-semibold transition flex items-center justify-center gap-1 shadow-sm"
                              >
                                <span>📋 Copiar Instrução para Antigravity</span>
                              </button>
                            </div>
                          )}

                          {/* Quick Column Shift Selector */}
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Mover para:</span>
                            <select
                              value={task.column}
                              onChange={e => handleMove(task.id, e.target.value as TaskColumn)}
                              className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                            >
                              {COLUMNS.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Nova Tarefa / Hipótese</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Projeto Relacionado *</label>
                <select
                  required
                  value={newTask.project_id}
                  onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">Selecione o projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Ex: Auditoria de cabeçalhos de segurança HTTP"
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                  >
                    <option value="SECURITY">Segurança</option>
                    <option value="ARCHITECTURE">Arquitetura</option>
                    <option value="QA">Qualidade / QA</option>
                    <option value="UX">UX / Usabilidade</option>
                    <option value="LEGAL">Jurídico / LGPD</option>
                    <option value="GROWTH">Crescimento</option>
                    <option value="PRODUCT">Produto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prioridade</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                  >
                    <option value="CRITICAL">Crítica</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Média</option>
                    <option value="LOW">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded bg-surface-950 border border-slate-800">
                <input
                  type="checkbox"
                  id="reqApproval"
                  checked={newTask.requires_approval}
                  onChange={e => setNewTask({ ...newTask, requires_approval: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-brand-500"
                />
                <label htmlFor="reqApproval" className="text-slate-300 font-medium cursor-pointer">
                  Exigir aprovação prévia do operador humano (Alto risco)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Critérios de Aceite (um por linha)</label>
                <textarea
                  rows={2}
                  value={newTask.acceptance_criteria}
                  onChange={e => setNewTask({ ...newTask, acceptance_criteria: e.target.value })}
                  placeholder="Ex: Cabeçalho CSP validado&#10;Ausência de inline scripts confirmada"
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white"
                />
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
                  {submitting ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
