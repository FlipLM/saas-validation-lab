import { queryOne, execute, transaction } from '../db/index.js';
import { ExecutionJob, Project, Task } from '../types/index.js';
import { AgentRunner } from '../agents/agent-runner.js';
import { AgentContext } from '../agents/types.js';
import { TelegramAdapter } from '../integrations/telegram/telegram-adapter.js';

export class Worker {
  private isProcessing = false;

  async processNextJob(): Promise<boolean> {
    if (this.isProcessing) return false;
    this.isProcessing = true;

    try {
      // 1. Captura atômica de um job em fila com transação imediata
      const job = transaction(() => {
        // Seleciona e atualiza simultaneamente para RUNNING
        const candidate = queryOne<ExecutionJob>(`
          SELECT * FROM execution_jobs 
          WHERE status = 'QUEUED' 
          ORDER BY created_at ASC 
          LIMIT 1
        `);

        if (!candidate) return null;

        execute(`
          UPDATE execution_jobs
          SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP, heartbeat_at = CURRENT_TIMESTAMP, attempts = attempts + 1
          WHERE id = ?
        `, [candidate.id]);

        return queryOne<ExecutionJob>('SELECT * FROM execution_jobs WHERE id = ?', [candidate.id]);
      });

      if (!job) {
        return false; // Nenhum job disponível
      }

      console.log(`[WORKER] Job capturado: ${job.id} (Agente: ${job.agent_id})`);

      // 2. Carrega contexto do projeto
      const project = queryOne<Project>('SELECT * FROM projects WHERE id = ?', [job.project_id]);
      if (!project) {
        execute(`
          UPDATE execution_jobs 
          SET status = 'FAILED', error_message = 'Projeto associado não encontrado', finished_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [job.id]);
        return true;
      }

      let scopeObj: any = {};
      try {
        scopeObj = JSON.parse(project.auth_scope);
      } catch {
        scopeObj = {};
      }

      const task = job.task_id 
        ? queryOne<Task>('SELECT * FROM tasks WHERE id = ?', [job.task_id])
        : null;

      const agentCtx: AgentContext = {
        project_id: project.id,
        project_name: project.name,
        target_url: project.target_url,
        repo_url: project.repo_url,
        environment: project.environment,
        allowed_domains: scopeObj.allowed_domains || [],
        exclusions: scopeObj.exclusions || [],
        rate_limit_per_min: scopeObj.rate_limit_per_min || 60,
        task_id: job.task_id,
        task_title: task?.title,
      };

      // 3. Heartbeat periódico em background enquanto o agente executa
      const heartbeatInterval = setInterval(() => {
        execute("UPDATE execution_jobs SET heartbeat_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'RUNNING'", [job.id]);
      }, 5000);

      try {
        // 4. Execução do Agente Especializado
        const runResult = await AgentRunner.runAgent(job.agent_id, agentCtx, job.id);
        clearInterval(heartbeatInterval);

        // 5. Sucesso na execução
        execute(`
          UPDATE execution_jobs
          SET status = 'SUCCEEDED', result = ?, finished_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [JSON.stringify(runResult), job.id]);

        // Se o job estava vinculado a uma tarefa no Kanban, move para IN_REVIEW
        if (job.task_id) {
          execute(`
            UPDATE tasks 
            SET column = 'IN_REVIEW', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND column = 'IN_PROGRESS'
          `, [job.task_id]);
        }

        // Notificação opcional via Telegram
        this.notifyTelegram(project.name, job.agent_id, runResult.persistedFindingsCount);

        return true;
      } catch (err: any) {
        clearInterval(heartbeatInterval);
        console.error(`[WORKER] Erro na execução do job ${job.id}:`, err);

        const currentAttempts = job.attempts + 1;
        const maxRetries = job.max_retries || 3;

        if (currentAttempts < maxRetries) {
          execute(`
            UPDATE execution_jobs
            SET status = 'RETRY_PENDING', error_message = ?, finished_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [err.message, job.id]);
        } else {
          execute(`
            UPDATE execution_jobs
            SET status = 'FAILED', error_message = ?, finished_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [err.message, job.id]);

          if (job.task_id) {
            execute(`
              UPDATE tasks 
              SET column = 'BLOCKED', updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [job.task_id]);
          }
        }

        return true;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async notifyTelegram(projectName: string, agentName: string, findingsCount: number) {
    try {
      const telegramInteg = queryOne<{ config_masked: string; status: string }>(`
        SELECT config_masked, status FROM integrations WHERE id = 'telegram'
      `);
      if (telegramInteg && telegramInteg.status === 'TESTED') {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) {
          const adapter = new TelegramAdapter(token, chatId);
          await adapter.sendMessage(
            `🚀 *SaaS Validation Lab - Auditoria Concluída*\n\n` +
            `*Projeto*: ${projectName}\n` +
            `*Agente*: ${agentName}\n` +
            `*Achados Mapeados*: ${findingsCount}\n` +
            `*Status*: Resultados persistidos no painel.`
          );
        }
      }
    } catch (err) {
      // Notificação secundária não quebra o fluxo de execução principal
      console.warn('[WORKER] Falha no envio de notificação Telegram:', err);
    }
  }
}
