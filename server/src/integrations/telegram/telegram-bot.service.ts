import { queryOne } from '../../db/index.js';
import { TelegramAdapter } from './telegram-adapter.js';
import { OrchestratorControlService } from '../../services/orchestrator-control.service.js';

export class TelegramBotService {
  private static isRunning = false;
  private static currentOffset = 0;
  private static pollTimeout: NodeJS.Timeout | null = null;

  static async getAdapter(): Promise<{ adapter: TelegramAdapter; chatId: string } | null> {
    try {
      const telegramInteg = queryOne<{ config_secure: string; status: string }>(`
        SELECT config_secure, status FROM integrations WHERE id = 'telegram'
      `);

      let conf: any = {};
      if (telegramInteg?.config_secure) {
        try {
          conf = JSON.parse(telegramInteg.config_secure);
        } catch {
          conf = {};
        }
      }

      const token = (conf.bot_token || process.env.TELEGRAM_BOT_TOKEN || '').trim();
      const chatId = (conf.chat_id || process.env.TELEGRAM_CHAT_ID || '').trim();

      if (!token || token === 'NOT_SET') {
        return null;
      }

      return {
        adapter: new TelegramAdapter(token, chatId),
        chatId,
      };
    } catch (err) {
      console.warn('[TELEGRAM-BOT] Erro ao instanciar adapter:', err);
      return null;
    }
  }

  static getInteractiveKeyboard(webUrl = 'http://7vynlqklkgwlz6s0rmh89nfl.143.95.213.67.sslip.io') {
    return [
      [
        { text: '🚀 Aprovar Teste de Carga', callback_data: 'action:approve_stress' },
        { text: '🛠️ Gerar Tarefas de Correção', callback_data: 'action:generate_fixes' },
      ],
      [
        { text: '✅ Aprovar Tudo (DONE)', callback_data: 'action:promote_done' },
        { text: '🔄 Re-executar Ciclo', callback_data: 'action:rerun_audit' },
      ],
      [
        { text: '📊 Gerar Novo Relatório', callback_data: 'action:new_report' },
        { text: '🌐 Abrir Painel Web', url: `${webUrl}/reports` },
      ],
    ];
  }

  static async sendReportPrompt(reportTitle: string, score: number, verdict: string, findingsSummary: string) {
    const config = await this.getAdapter();
    if (!config || !config.chatId) return;

    const message = `📋 *Novo Relatório de Maturidade Emitido!*\n\n` +
      `*Título*: ${reportTitle}\n` +
      `*Score de Prontidão*: *${score}/100*\n` +
      `*Veredito*: \`${verdict}\`\n\n` +
      `*Resumo de Achados*:\n${findingsSummary}\n\n` +
      `❓ *Como o Agente Orquestrador deve prosseguir agora?*\n` +
      `Selecione uma ação nos botões interativos abaixo:`;

    await config.adapter.sendMessageWithButtons(message, this.getInteractiveKeyboard());
  }

  static start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[TELEGRAM-BOT] Serviço de Long Polling do Telegram iniciado.');
    this.pollLoop();
  }

  static stop() {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log('[TELEGRAM-BOT] Serviço de Long Polling do Telegram finalizado.');
  }

  private static async pollLoop() {
    if (!this.isRunning) return;

    try {
      const config = await this.getAdapter();
      if (!config) {
        // Se ainda não configurado, espera 15s antes de checar novamente
        this.pollTimeout = setTimeout(() => this.pollLoop(), 15000);
        return;
      }

      const updatesResponse = await config.adapter.getUpdates(this.currentOffset, 15);
      if (updatesResponse.ok && Array.isArray(updatesResponse.result)) {
        for (const update of updatesResponse.result) {
          this.currentOffset = update.update_id + 1;

          // 1. Tratamento de clique em botão (Callback Query)
          if (update.callback_query) {
            await this.handleCallbackQuery(config.adapter, update.callback_query);
          }
          // 2. Tratamento de mensagem de texto enviada pelo usuário
          else if (update.message && update.message.text) {
            await this.handleUserMessage(config.adapter, update.message);
          }
        }
      }
    } catch (err: any) {
      console.warn('[TELEGRAM-BOT] Erro temporário no pollLoop:', err.message);
    }

    if (this.isRunning) {
      this.pollTimeout = setTimeout(() => this.pollLoop(), 1000);
    }
  }

  private static async handleCallbackQuery(adapter: TelegramAdapter, cq: any) {
    const data = cq.data || '';
    const queryId = cq.id;

    console.log(`[TELEGRAM-BOT] Callback Query recebido: "${data}" do usuário ${cq.from?.username || cq.from?.id}`);

    // Confirma recebimento para fechar o loading visual no app do Telegram
    await adapter.answerCallbackQuery(queryId, 'Processando ação pelo Orquestrador...');

    // Executa a ação no Orquestrador
    const result = await OrchestratorControlService.executeDecision(data);
    const status = OrchestratorControlService.getStatus();

    const responseMsg = `${result.message}\n\n` +
      `📊 *Status Atual do Projeto (${status.projectName})*:\n` +
      `• Em Andamento: *${status.counts.in_progress}*\n` +
      `• Fila (TODO): *${status.counts.todo}*\n` +
      `• Em Revisão: *${status.counts.in_review}*\n` +
      `• Concluídas: *${status.counts.done}*\n` +
      `• Backlog: *${status.counts.backlog}*\n\n` +
      `💡 _${status.recommendation}_\n\n` +
      `Qual deve ser a próxima instrução?`;

    await adapter.sendMessageWithButtons(responseMsg, this.getInteractiveKeyboard());
  }

  private static async handleUserMessage(adapter: TelegramAdapter, msg: any) {
    const text = (msg.text || '').trim();
    console.log(`[TELEGRAM-BOT] Mensagem de texto recebida: "${text}"`);

    const status = OrchestratorControlService.getStatus();
    const responseMsg = `🤖 *SaaS Validation Lab - Assistente Orquestrador*\n\n` +
      `*Projeto Alvo*: ${status.projectName}\n` +
      `*Status do Kanban*:\n` +
      `• 🏃 Em Andamento: *${status.counts.in_progress}*\n` +
      `• 📋 Fila (TODO): *${status.counts.todo}*\n` +
      `• 🔍 Em Revisão: *${status.counts.in_review}*\n` +
      `• ✅ Concluídas: *${status.counts.done}*\n` +
      `• ⏳ Backlog: *${status.counts.backlog}*\n` +
      `• ⚠️ Aprovações Pendentes: *${status.counts.pending_approvals}*\n\n` +
      `💡 *Diretriz Atual*: ${status.recommendation}\n\n` +
      `*Como você gostaria que o Orquestrador continue agora?* Escolha uma opção abaixo:`;

    await adapter.sendMessageWithButtons(responseMsg, this.getInteractiveKeyboard());
  }
}
