import { queryOne, execute, transaction } from '../db/index.js';
import { OpenRouterAdapter, LLMSpecialty, OpenRouterGenerateOptions } from '../integrations/openrouter/openrouter-client.js';
import { TelegramAdapter } from '../integrations/telegram/telegram-adapter.js';
import crypto from 'node:crypto';

import { AgentActivityService } from './agent-activity.service.js';

export class LLMService {
  private static getOpenRouterClient(): OpenRouterAdapter {
    let apiKey = process.env.OPENROUTER_API_KEY || '';

    try {
      const row = queryOne<{ config_secure: string }>(`
        SELECT config_secure FROM integrations WHERE id = 'openrouter'
      `);
      if (row?.config_secure) {
        const parsed = JSON.parse(row.config_secure);
        if (parsed.api_key && parsed.api_key !== 'NOT_SET') {
          apiKey = parsed.api_key;
        }
      }
    } catch (err) {
      console.warn('[LLM-SERVICE] Falha ao ler credenciais do banco:', err);
    }

    return new OpenRouterAdapter(apiKey);
  }

  static async generate(
    prompt: string,
    options: OpenRouterGenerateOptions & { 
      taskId?: string; 
      projectId?: string; 
      taskTitle?: string;
      agentId?: string;
      executionId?: string;
    } = {}
  ): Promise<{
    content: string;
    reasoning?: string;
    modelUsed?: string;
    escalatedToAntigravity: boolean;
    escalationReason?: string;
  }> {
    if (options.projectId) {
      AgentActivityService.recordActivity({
        projectId: options.projectId,
        executionId: options.executionId,
        taskId: options.taskId,
        agentId: options.agentId || 'Hermes Agent',
        stage: 'THINKING',
        thought: `[Planejamento Inicial]: Avaliando a tarefa "${options.taskTitle || 'Execução Especializada'}". Definindo parâmetros e contexto técnico do SaaS FisioteraHub.`,
        modelUsed: 'Orquestrador / LLM Gateway'
      });
    }

    const client = this.getOpenRouterClient();
    const result = await client.generate(prompt, options);

    if (options.projectId && result.reasoning) {
      AgentActivityService.recordActivity({
        projectId: options.projectId,
        executionId: options.executionId,
        taskId: options.taskId,
        agentId: options.agentId || 'Hermes Agent',
        stage: 'THINKING',
        thought: result.reasoning,
        modelUsed: result.modelUsed
      });
    }

    if (options.projectId && result.content) {
      AgentActivityService.recordActivity({
        projectId: options.projectId,
        executionId: options.executionId,
        taskId: options.taskId,
        agentId: options.agentId || 'Hermes Agent',
        stage: 'PRODUCING',
        outputProduced: result.content,
        modelUsed: result.modelUsed
      });
    }

    if (result.escalatedToAntigravity && options.taskId) {
      if (options.projectId) {
        AgentActivityService.recordActivity({
          projectId: options.projectId,
          executionId: options.executionId,
          taskId: options.taskId,
          agentId: options.agentId || 'Hermes Agent',
          stage: 'ESCALATED',
          thought: `Escalação para o Antigravity (IDE Local): ${result.escalationReason}`,
          modelUsed: result.modelUsed
        });
      }
      await this.escalateTaskToAntigravity(options.taskId, options.projectId, options.taskTitle, result.escalationReason);
    }

    return {
      content: result.content,
      reasoning: result.reasoning,
      modelUsed: result.modelUsed,
      escalatedToAntigravity: result.escalatedToAntigravity,
      escalationReason: result.escalationReason,
    };
  }

  static async escalateTaskToAntigravity(
    taskId: string,
    projectId?: string,
    taskTitle?: string,
    reason?: string
  ): Promise<void> {
    const escalationReason = reason || 'Tarefa complexa ou limite de tokens gratuitos do OpenRouter excedido.';

    transaction(() => {
      execute(`
        UPDATE tasks 
        SET assigned_agent = 'Antigravity (IDE Local)', column = 'BLOCKED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [taskId]);

      execute(`
        INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
        VALUES (?, 'llm_service', 'ESCALATE_TO_ANTIGRAVITY', 'task', ?, ?)
      `, [
        crypto.randomUUID(),
        taskId,
        JSON.stringify({ reason: escalationReason, escalatedAt: new Date().toISOString() })
      ]);
    });

    console.log(`[LLM-SERVICE] Tarefa "${taskId}" (${taskTitle || 'Sem título'}) escalada para o Antigravity.`);

    // Envio de alerta no Telegram
    try {
      const telegramInteg = queryOne<{ config_secure: string }>(`
        SELECT config_secure FROM integrations WHERE id = 'telegram'
      `);
      if (telegramInteg?.config_secure) {
        const conf = JSON.parse(telegramInteg.config_secure);
        if (conf.bot_token && conf.chat_id) {
          const adapter = new TelegramAdapter(conf.bot_token, conf.chat_id);
          const message = `⚠️ *Tarefa Escalada para o Antigravity (IDE Local)!*\n\n` +
            `*ID da Tarefa*: \`${taskId}\`\n` +
            `*Título*: ${taskTitle || 'Tarefa Técnica de Código'}\n` +
            `*Motivo*: ${escalationReason}\n\n` +
            `💡 *Instrução para Execução*:\n` +
            `Abra o chat do Antigravity no seu computador e digite:\n` +
            `\`Antigravity, execute a tarefa escalada #${taskId}\``;

          await adapter.sendMessageWithButtons(message, [
            [
              { text: '🌐 Ver no Painel Kanban', url: 'http://7vynlqklkgwlz6s0rmh89nfl.143.95.213.67.sslip.io/kanban' }
            ]
          ]);
        }
      }
    } catch (err) {
      console.warn('[LLM-SERVICE] Falha ao enviar alerta de escalação no Telegram:', err);
    }
  }

  static listEscalatedTasks(projectId?: string) {
    let sql = `
      SELECT t.*, p.name as project_name 
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.assigned_agent = 'Antigravity (IDE Local)'
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ' AND t.project_id = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY t.priority, t.updated_at DESC';
    return queryOne<any>(sql, params);
  }
}
