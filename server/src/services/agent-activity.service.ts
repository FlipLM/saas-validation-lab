import { queryAll, queryOne, execute } from '../db/index.js';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Response } from 'express';

export type AgentStage = 
  | 'THINKING' 
  | 'ANALYZING' 
  | 'PRODUCING' 
  | 'VALIDATING' 
  | 'COMPLETED' 
  | 'ESCALATED';

export interface AgentActivity {
  id: string;
  project_id: string;
  execution_id?: string;
  task_id?: string;
  agent_id: string;
  stage: AgentStage;
  thought?: string;
  output_produced?: string;
  model_used?: string;
  created_at: string;
  // Joins
  project_name?: string;
  task_title?: string;
}

class AgentActivityManager extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  recordActivity(data: {
    projectId: string;
    executionId?: string;
    taskId?: string;
    agentId: string;
    stage: AgentStage;
    thought?: string;
    outputProduced?: string;
    modelUsed?: string;
  }): AgentActivity {
    const id = crypto.randomUUID();
    const thought = data.thought || null;
    const outputProduced = data.outputProduced || null;
    const modelUsed = data.modelUsed || null;

    try {
      execute(`
        INSERT INTO agent_activities (
          id, project_id, execution_id, task_id, agent_id, stage, thought, output_produced, model_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.projectId,
        data.executionId || null,
        data.taskId || null,
        data.agentId,
        data.stage,
        thought,
        outputProduced,
        modelUsed
      ]);

      const saved = queryOne<AgentActivity>(`
        SELECT 
          a.*,
          p.name as project_name,
          t.title as task_title
        FROM agent_activities a
        LEFT JOIN projects p ON p.id = a.project_id
        LEFT JOIN tasks t ON t.id = a.task_id
        WHERE a.id = ?
      `, [id]);

      if (saved) {
        // Emite para clientes SSE em tempo real
        this.emit('activity', saved);
        return saved;
      }
    } catch (err) {
      console.error('[AGENT-ACTIVITY] Falha ao persistir atividade do agente:', err);
    }

    const fallback: AgentActivity = {
      id,
      project_id: data.projectId,
      execution_id: data.executionId,
      task_id: data.taskId,
      agent_id: data.agentId,
      stage: data.stage,
      thought: data.thought,
      output_produced: data.outputProduced,
      model_used: data.modelUsed,
      created_at: new Date().toISOString()
    };
    this.emit('activity', fallback);
    return fallback;
  }

  listActivities(options: {
    projectId?: string;
    agentId?: string;
    stage?: string;
    limit?: number;
    since?: string;
  } = {}): AgentActivity[] {
    let sql = `
      SELECT 
        a.*,
        p.name as project_name,
        t.title as task_title
      FROM agent_activities a
      LEFT JOIN projects p ON p.id = a.project_id
      LEFT JOIN tasks t ON t.id = a.task_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.projectId) {
      sql += ' AND a.project_id = ?';
      params.push(options.projectId);
    }
    if (options.agentId) {
      sql += ' AND a.agent_id = ?';
      params.push(options.agentId);
    }
    if (options.stage) {
      sql += ' AND a.stage = ?';
      params.push(options.stage);
    }
    if (options.since) {
      sql += ' AND a.created_at > ?';
      params.push(options.since);
    }

    const limit = options.limit || 60;
    sql += ` ORDER BY a.created_at DESC LIMIT ${Math.min(limit, 200)}`;

    return queryAll<AgentActivity>(sql, params);
  }

  subscribeSSE(res: Response, projectId?: string) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Envia mensagem inicial
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    // Envia as últimas 15 atividades recentes para dar contexto imediato
    const initialActivities = this.listActivities({ projectId, limit: 15 });
    for (const act of initialActivities.reverse()) {
      res.write(`data: ${JSON.stringify({ type: 'ACTIVITY', data: act })}\n\n`);
    }

    const onActivity = (activity: AgentActivity) => {
      if (projectId && activity.project_id !== projectId) {
        return;
      }
      res.write(`data: ${JSON.stringify({ type: 'ACTIVITY', data: activity })}\n\n`);
    };

    this.on('activity', onActivity);

    // Heartbeat a cada 15s para manter a conexão aberta
    const pinger = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    res.on('close', () => {
      this.off('activity', onActivity);
      clearInterval(pinger);
      res.end();
    });
  }
}

export const AgentActivityService = new AgentActivityManager();
