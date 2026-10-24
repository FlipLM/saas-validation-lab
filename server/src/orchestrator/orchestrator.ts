import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { Task, ExecutionJob } from '../types/index.js';
import crypto from 'node:crypto';

export class Orchestrator {
  async runCycle(): Promise<{
    zombiesRecovered: number;
    tasksEnqueued: number;
    approvalsRequested: number;
  }> {
    // 1. Checa se a automação global está pausada
    const pauseSetting = queryOne<{ value: string }>('SELECT value FROM policy_settings WHERE key = ?', ['GLOBAL_AUTOMATION_PAUSED']);
    if (pauseSetting?.value === 'true') {
      return { zombiesRecovered: 0, tasksEnqueued: 0, approvalsRequested: 0 };
    }

    let zombiesRecovered = 0;
    let tasksEnqueued = 0;
    let approvalsRequested = 0;

    // 2. Recuperação de Jobs Órfãos / Crash Recovery
    // Se um job está RUNNING e não recebeu heartbeat nos últimos 60 segundos, o worker travou ou foi reiniciado
    const zombieJobs = queryAll<ExecutionJob>(`
      SELECT * FROM execution_jobs 
      WHERE status = 'RUNNING' 
        AND heartbeat_at IS NOT NULL 
        AND (strftime('%s', 'now') - strftime('%s', heartbeat_at)) > 60
    `);

    for (const z of zombieJobs) {
      transaction(() => {
        const attempts = z.attempts;
        const maxRetries = z.max_retries || 3;

        if (attempts < maxRetries) {
          execute(`
            UPDATE execution_jobs 
            SET status = 'RETRY_PENDING', error_message = 'Recuperado de falha: Worker expirou sem heartbeat.' 
            WHERE id = ?
          `, [z.id]);
        } else {
          execute(`
            UPDATE execution_jobs 
            SET status = 'FAILED', error_message = 'Falha crítica: Worker expirou e excedeu limite de retries.', finished_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [z.id]);

          if (z.task_id) {
            execute("UPDATE tasks SET column = 'BLOCKED' WHERE id = ?", [z.task_id]);
          }
        }
        zombiesRecovered++;
      });
    }

    // 3. Re-enfileiramento de jobs em RETRY_PENDING
    execute(`
      UPDATE execution_jobs 
      SET status = 'QUEUED' 
      WHERE status = 'RETRY_PENDING'
    `);

    // 4. Avaliação do Kanban: Tarefas em TODO elegíveis para execução
    const eligibleTasks = queryAll<Task>(`
      SELECT t.* 
      FROM tasks t
      WHERE t.column = 'TODO'
        AND NOT EXISTS (
          SELECT 1 FROM execution_jobs ej 
          WHERE ej.task_id = t.id AND ej.status IN ('QUEUED', 'RUNNING', 'WAITING_APPROVAL')
        )
      ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
      LIMIT 5
    `);

    for (const task of eligibleTasks) {
      // Checa se há dependências não concluídas
      const pendingDeps = queryOne<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM task_dependencies td
        JOIN tasks dep ON dep.id = td.depends_on_task_id
        WHERE td.task_id = ? AND dep.column != 'DONE'
      `, [task.id])?.count || 0;

      if (pendingDeps > 0) {
        // Aguarda conclusão das dependências
        continue;
      }

      // Checa se exige aprovação humana
      if (task.requires_approval === 1) {
        const existingApproval = queryOne<{ id: string; status: string }>(`
          SELECT id, status FROM approvals WHERE task_id = ?
        `, [task.id]);

        if (!existingApproval) {
          // Cria solicitação de aprovação
          const approvalId = crypto.randomUUID();
          execute(`
            INSERT INTO approvals (id, task_id, operation_type, scope_requested, risk_assessment, status)
            VALUES (?, ?, ?, ?, ?, 'PENDING')
          `, [
            approvalId,
            task.id,
            `EXECUTION_${task.category}`,
            `Tarefa "${task.title}" (Risco: ${task.risk_level})`,
            `A tarefa possui risco ${task.risk_level} e requer autorização humana expressa conforme política de segurança.`,
          ]);
          approvalsRequested++;
          continue;
        } else if (existingApproval.status !== 'APPROVED') {
          // Permanece aguardando deliberação
          continue;
        }
      }

      // Se elegível, enfileira o job e move tarefa para IN_PROGRESS
      transaction(() => {
        const jobId = crypto.randomUUID();
        const agentName = task.assigned_agent || (
          task.category === 'SECURITY' ? 'Web Recon Agent' :
          task.category === 'LEGAL' ? 'Legal Research Analyst' :
          task.category === 'QA' ? 'QA, Security & Reliability Agent' :
          task.category === 'UX' ? 'UX Recon Agent' : 'Product Discovery Agent'
        );

        execute(`
          INSERT INTO execution_jobs (id, task_id, project_id, agent_id, status, max_retries)
          VALUES (?, ?, ?, ?, 'QUEUED', 3)
        `, [jobId, task.id, task.project_id, agentName]);

        execute(`
          UPDATE tasks 
          SET column = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [task.id]);

        execute(`
          INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
          VALUES (?, 'orchestrator', 'ENQUEUE_TASK', 'task', ?, ?)
        `, [
          crypto.randomUUID(),
          task.id,
          JSON.stringify({ agent: agentName, jobId, priority: task.priority })
        ]);

        tasksEnqueued++;
      });
    }

    return { zombiesRecovered, tasksEnqueued, approvalsRequested };
  }
}
