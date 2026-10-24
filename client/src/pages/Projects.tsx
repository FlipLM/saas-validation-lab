import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Project, ProjectEnvironment } from '../types/index.js';
import { 
  Layers, 
  Plus, 
  Globe, 
  GitBranch, 
  ShieldCheck, 
  Trash2, 
  ExternalLink,
  Activity
} from 'lucide-react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_url: '',
    repo_url: '',
    environment: 'development' as ProjectEnvironment,
    allowed_domains: '',
    exclusions: '',
    rate_limit: 60,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de projetos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const domains = formData.allowed_domains
        ? formData.allowed_domains.split(',').map(d => d.trim()).filter(Boolean)
        : [];
      const exclusions = formData.exclusions
        ? formData.exclusions.split(',').map(ex => ex.trim()).filter(Boolean)
        : [];

      await api.createProject({
        name: formData.name,
        description: formData.description,
        target_url: formData.target_url,
        repo_url: formData.repo_url || undefined,
        environment: formData.environment,
        auth_scope: JSON.stringify({
          allowed_domains: domains,
          exclusions,
          rate_limit_per_min: formData.rate_limit,
        }),
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        target_url: '',
        repo_url: '',
        environment: 'development',
        allowed_domains: '',
        exclusions: '',
        rate_limit: 60,
      });
      loadProjects();
    } catch (err: any) {
      alert(`Erro ao cadastrar projeto: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o projeto "${name}" e todos os seus dados isolados?`)) {
      return;
    }
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-brand-500" />
            <span>Gestão de Produtos SaaS</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre múltiplos produtos, delimite o escopo autorizado e isole relatórios e descobertas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto SaaS</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Nenhum projeto SaaS cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Comece cadastrando o primeiro SaaS alvo para iniciar o reconhecimento de rotas, auditoria de segurança e pesquisa jurídica.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Cadastrar Primeiro Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            let scopeObj: any = {};
            try {
              scopeObj = JSON.parse(proj.auth_scope);
            } catch {
              scopeObj = {};
            }

            const envBadges: Record<string, string> = {
              development: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              staging: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              production: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            };

            return (
              <div key={proj.id} className="glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight line-clamp-1">{proj.name}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${envBadges[proj.environment] || envBadges.development}`}>
                      {proj.environment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{proj.description || 'Sem descrição informada.'}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <Globe className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <a href={proj.target_url} target="_blank" rel="noreferrer" className="hover:text-brand-300 truncate flex items-center gap-1">
                        <span>{proj.target_url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                    {proj.repo_url && (
                      <div className="flex items-center gap-2 text-slate-400 font-mono">
                        <GitBranch className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{proj.repo_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Escopo Delimitado */}
                  <div className="p-2.5 rounded-lg bg-surface-950/60 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Escopo Autorizado</span>
                    </div>
                    <p className="text-slate-400">
                      Domínios: <span className="text-slate-200">{scopeObj.allowed_domains?.join(', ') || 'Auto-restrito ao alvo'}</span>
                    </p>
                    <p className="text-slate-400">
                      Rate limit: <span className="text-slate-200">{scopeObj.rate_limit_per_min || 60} req/min</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Tarefas: <strong className="text-white font-mono">{proj.tasks_count || 0}</strong></span>
                    <span>Achados: <strong className="text-white font-mono">{proj.findings_count || 0}</strong></span>
                  </div>
                  <button
                    onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-5 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Novo Projeto SaaS</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Produto SaaS *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Acme CRM Cloud"
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição e Finalidade</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o propósito da aplicação e hipóteses de validação"
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL Principal do Alvo *</label>
                  <input
                    type="url"
                    required
                    value={formData.target_url}
                    onChange={e => setFormData({ ...formData, target_url: e.target.value })}
                    placeholder="https://app.example.com"
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ambiente</label>
                  <select
                    value={formData.environment}
                    onChange={e => setFormData({ ...formData, environment: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="development">Desenvolvimento (Local/Dev)</option>
                    <option value="staging">Homologação (Staging)</option>
                    <option value="production">Produção (Auditoria Passiva)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repositório de Código (Opcional)</label>
                <input
                  type="url"
                  value={formData.repo_url}
                  onChange={e => setFormData({ ...formData, repo_url: e.target.value })}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Escopo Delimitado */}
              <div className="p-3 rounded-lg bg-surface-950 border border-slate-800 space-y-3">
                <span className="font-semibold text-brand-400 block">Delimitação Rigorosa de Escopo</span>

                <div>
                  <label className="block text-slate-400 mb-0.5">Domínios Permitidos (separados por vírgula)</label>
                  <input
                    type="text"
                    value={formData.allowed_domains}
                    onChange={e => setFormData({ ...formData, allowed_domains: e.target.value })}
                    placeholder="app.example.com, api.example.com"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-0.5">Rotas Excluídas</label>
                    <input
                      type="text"
                      value={formData.exclusions}
                      onChange={e => setFormData({ ...formData, exclusions: e.target.value })}
                      placeholder="/delete, /admin"
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Taxa Máxima (req/min)</label>
                    <input
                      type="number"
                      value={formData.rate_limit}
                      onChange={e => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || 60 })}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-[11px]"
                    />
                  </div>
                </div>
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
                  {submitting ? 'Salvando...' : 'Cadastrar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
