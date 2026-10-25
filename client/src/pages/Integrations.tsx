import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Integration, IntegrationStatus } from '../types/index.js';
import { 
  Cpu, 
  ExternalLink, 
  Play, 
  Settings, 
  PowerOff, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Activity,
  Layers,
  Coins
} from 'lucide-react';

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Modal State
  const [configuringItem, setConfiguringItem] = useState<Integration | null>(null);
  const [pentagiUrl, setPentagiUrl] = useState('');
  const [pentagiKey, setPentagiKey] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('openrouter/free');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await api.listIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (id: string) => {
    try {
      setTestingId(id);
      await api.testIntegration(id);
      loadIntegrations();
    } catch (err: any) {
      alert(`Falha no teste: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm('Deseja desativar esta integração?')) return;
    try {
      await api.disableIntegration(id);
      loadIntegrations();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const openConfigModal = (integ: Integration) => {
    setConfiguringItem(integ);
    if (integ.id === 'pentagi') {
      setPentagiUrl(integ.config.api_url || 'http://localhost:8080');
      setPentagiKey(integ.config.api_key || '');
    } else if (integ.id === 'telegram') {
      setTelegramToken(integ.config.bot_token || '');
      setTelegramChatId(integ.config.chat_id || '');
    } else if (integ.id === 'openrouter') {
      setOpenrouterKey(integ.config.api_key || '');
      setOpenrouterModel(integ.config.default_model || 'openrouter/free');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringItem) return;

    try {
      setSubmitting(true);
      let payload: any = {};
      if (configuringItem.id === 'pentagi') {
        payload = { api_url: pentagiUrl, api_key: pentagiKey, enabled: true };
      } else if (configuringItem.id === 'telegram') {
        payload = { bot_token: telegramToken, chat_id: telegramChatId, enabled: true };
      } else if (configuringItem.id === 'openrouter') {
        payload = { api_key: openrouterKey, default_model: openrouterModel, enabled: true };
      }

      await api.updateIntegrationConfig(configuringItem.id, payload);
      setConfiguringItem(null);
      loadIntegrations();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadges: Record<IntegrationStatus, { bg: string; text: string; icon: any }> = {
    TESTED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    CONFIGURED: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', icon: Clock },
    TESTING: { bg: 'bg-blue-500/10 border-blue-500/20 animate-pulse', text: 'text-blue-400', icon: Activity },
    FAILED: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400', icon: XCircle },
    BLOCKED: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
    NOT_CONFIGURED: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', icon: Clock },
    DISABLED: { bg: 'bg-slate-700/20 border-slate-700/40', text: 'text-slate-500', icon: PowerOff },
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-brand-500" />
            <span>Central de Integrações e Adaptadores Reais</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Status real comprovado por testes. PentAGI para segurança ofensiva e Telegram Bot API oficial.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Activity className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map(integ => {
            const badge = statusBadges[integ.status] || statusBadges.NOT_CONFIGURED;
            const StatusIcon = badge.icon;
            const isTesting = testingId === integ.id;

            return (
              <div 
                key={integ.id} 
                className="glass-panel p-6 rounded-2xl space-y-5 border border-slate-800 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{integ.name}</span>
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">ID: {integ.id}</span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'TESTING...' : integ.status}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {integ.metadata?.purpose}
                  </p>

                  {/* Requirements & Costs */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-950/70 border border-slate-800 space-y-1">
                      <div className="text-slate-400 font-semibold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Requisitos de Infraestrutura</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{integ.metadata?.requirements}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-950/70 border border-slate-800 space-y-1">
                      <div className="text-slate-400 font-semibold flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Estimativa de Custo Externo</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{integ.metadata?.external_cost}</p>
                    </div>
                  </div>

                  {/* Mascaramento de Credenciais */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1">
                    <span className="text-slate-400 block font-sans font-semibold text-xs">
                      Configuração Ativa (Mascarada):
                    </span>
                    {Object.entries(integ.config).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mensagem de Erro se Houver */}
                  {integ.last_error && (
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-rose-400">Última Falha / Bloqueio:</span>
                        <p className="text-[11px]">{integ.last_error}</p>
                      </div>
                    </div>
                  )}

                  {integ.last_test_at && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Último teste: {new Date(integ.last_test_at).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {integ.metadata?.documentation_url && (
                    <a
                      href={integ.metadata.documentation_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>Documentação Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {integ.status !== 'DISABLED' && (
                      <button
                        onClick={() => handleDisable(integ.id)}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Desativar integração"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openConfigModal(integ)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configurar</span>
                    </button>

                    <button
                      onClick={() => handleTest(integ.id)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTesting ? 'Verificando...' : 'Testar Conexão'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Configuração */}
      {configuringItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-500" />
                <span>Configurar {configuringItem.name}</span>
              </h3>
              <button onClick={() => setConfiguringItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              {configuringItem.id === 'pentagi' ? (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">URL Base da API PentAGI *</label>
                    <input
                      type="url"
                      required
                      value={pentagiUrl}
                      onChange={e => setPentagiUrl(e.target.value)}
                      placeholder="http://localhost:8080"
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">API Key PentAGI (Opcional)</label>
                    <input
                      type="password"
                      value={pentagiKey}
                      onChange={e => setPentagiKey(e.target.value)}
                      placeholder="Insira a chave secreta"
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </>
              ) : configuringItem.id === 'telegram' ? (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telegram Bot Token *</label>
                    <input
                      type="password"
                      required
                      value={telegramToken}
                      onChange={e => setTelegramToken(e.target.value)}
                      placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Obtenha com o @BotFather no Telegram.</span>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telegram Chat ID *</label>
                    <input
                      type="text"
                      required
                      value={telegramChatId}
                      onChange={e => setTelegramChatId(e.target.value)}
                      placeholder="-100123456789 ou 987654321"
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">OpenRouter API Key *</label>
                    <input
                      type="password"
                      required
                      value={openrouterKey}
                      onChange={e => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500 font-mono text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Obtenha gratuitamente em openrouter.ai/keys.</span>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Roteador Padrão</label>
                    <select
                      value={openrouterModel}
                      onChange={e => setOpenrouterModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-white focus:outline-none focus:border-brand-500 text-xs"
                    >
                      <option value="openrouter/free">openrouter/free (Roteamento Dinâmico Inteligente)</option>
                      <option value="google/gemma-4-31b-it:free">google/gemma-4-31b-it:free</option>
                      <option value="cohere/north-mini-code:free">cohere/north-mini-code:free</option>
                    </select>
                    <span className="text-[10px] text-emerald-400 mt-1 block">✓ Fallback automático ativo. Se a cota esgotar, a tarefa é escalada para o Antigravity.</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfiguringItem(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar e Validar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
