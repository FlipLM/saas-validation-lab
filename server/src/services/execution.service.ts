import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { ExecutionJob, JobStatus } from '../types/index.js';
import crypto from 'node:crypto';

export class ExecutionService {
  static listJobs(filters?: { status?: string; projectId?: string; agentId?: string }) {
    let sql = `
      SELECT 
        j.*,
        p.name as project_name,
        t.title as task_title
      FROM execution_jobs j
      JOIN projects p ON p.id = j.project_id
      LEFT JOIN tasks t ON t.id = j.task_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.status) {
      sql += ' AND j.status = ?';
      params.push(filters.status);
    }
    if (filters?.projectId) {
      sql += ' AND j.project_id = ?';
      params.push(filters.projectId);
    }
    if (filters?.agentId) {
      sql += ' AND j.agent_id = ?';
      params.push(filters.agentId);
    }

    sql += ' ORDER BY j.created_at DESC LIMIT 50';
    return queryAll<ExecutionJob & { project_name: string; task_title?: string }>(sql, params);
  }

  static getJobById(id: string) {
    return queryOne<ExecutionJob & { project_name: string; task_title?: string }>(`
      SELECT 
        j.*,
        p.name as project_name,
        t.title as task_title
      FROM execution_jobs j
      JOIN projects p ON p.id = j.project_id
      LEFT JOIN tasks t ON t.id = j.task_id
      WHERE j.id = ?
    `, [id]);
  }

  static triggerExecution(data: {
    project_id: string;
    agent_id: string;
    task_id?: string;
    payload?: Record<string, any>;
  }) {
    const id = crypto.randomUUID();
    const payloadJson = JSON.stringify(data.payload || {});

    // Verifica se a automação global está pausada
    const pausedSetting = queryOne<{ value: string }>('SELECT value FROM policy_settings WHERE key = ?', ['GLOBAL_AUTOMATION_PAUSED']);
    const isPaused = pausedSetting?.value === 'true';

    const initialStatus: JobStatus = isPaused ? 'BLOCKED' : 'QUEUED';

    execute(`
      INSERT INTO execution_jobs (id, project_id, task_id, agent_id, status, payload, max_retries)
      VALUES (?, ?, ?, ?, ?, 3)
    `, [id, data.project_id, data.task_id || null, data.agent_id, initialStatus, payloadJson]);

    return this.getJobById(id);
  }

  static cancelJob(id: string, reason = 'Cancelado pelo operador') {
    const job = queryOne<ExecutionJob>('SELECT * FROM execution_jobs WHERE id = ?', [id]);
    if (!job) {
      throw new Error('Execução não encontrada');
    }

    if (job.status === 'SUCCEEDED' || job.status === 'CANCELLED') {
      throw new Error(`Não é possível cancelar uma execução que já está ${job.status}`);
    }

    execute(`
      UPDATE execution_jobs
      SET status = 'CANCELLED', error_message = ?, finished_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason, id]);

    return this.getJobById(id);
  }

  static setGlobalAutomationPause(pause: boolean) {
    execute(`
      INSERT INTO policy_settings (key, value, updated_at)
      VALUES ('GLOBAL_AUTOMATION_PAUSED', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `, [pause ? 'true' : 'false']);

    // Se pausou, registra no log de auditoria
    execute(`
      INSERT INTO audit_logs (id, actor, action, entity_type, details)
      VALUES (?, 'operator', ?, 'orchestrator', ?)
    `, [
      crypto.randomUUID(),
      pause ? 'PAUSE_GLOBAL_AUTOMATION' : 'RESUME_GLOBAL_AUTOMATION',
      JSON.stringify({ timestamp: new Date().toISOString() })
    ]);

    return { global_automation_paused: pause };
  }

  static getGlobalAutomationStatus() {
    const row = queryOne<{ value: string }>('SELECT value FROM policy_settings WHERE key = ?', ['GLOBAL_AUTOMATION_PAUSED']);
    return { global_automation_paused: row?.value === 'true' };
  }
}
