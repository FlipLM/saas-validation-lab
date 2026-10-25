import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { Task, TaskColumn } from '../types/index.js';
import crypto from 'node:crypto';
import { z } from 'zod';

export const createTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().optional().default(''),
  column: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']).default('BACKLOG'),
  category: z.enum(['SECURITY', 'ARCHITECTURE', 'QA', 'UX', 'LEGAL', 'GROWTH', 'PRODUCT']).default('PRODUCT'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']).optional().default('INFO'),
  confidence: z.enum(['CONFIRMED', 'HIGH', 'MEDIUM', 'SUSPECTED', 'UNVERIFIED']).optional().default('UNVERIFIED'),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']).default('LOW'),
  requires_approval: z.boolean().default(false),
  assigned_agent: z.string().optional(),
  acceptance_criteria: z.array(z.string()).default([]),
  dedup_key: z.string().optional(),
  dependencies: z.array(z.string().uuid()).optional().default([]),
});

export class TaskService {
  static listTasks(filters: { projectId?: string; column?: string; category?: string; priority?: string }) {
    let sql = `
      SELECT 
        t.*,
        p.name as project_name,
        (
          SELECT COUNT(*) 
          FROM task_dependencies td 
          JOIN tasks dep ON dep.id = td.depends_on_task_id
          WHERE td.task_id = t.id AND dep.column != 'DONE'
        ) as dependencies_pending
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.projectId) {
      sql += ' AND t.project_id = ?';
      params.push(filters.projectId);
    }
    if (filters.column) {
      sql += ' AND t.column = ?';
      params.push(filters.column);
    }
    if (filters.category) {
      sql += ' AND t.category = ?';
      params.push(filters.category);
    }
    if (filters.priority) {
      sql += ' AND t.priority = ?';
      params.push(filters.priority);
    }

    sql += " ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, t.created_at DESC";

    return queryAll<Task>(sql, params);
  }

  static getTaskById(id: string) {
    const task = queryOne<Task>(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = ?
    `, [id]);
    if (!task) return null;

    const dependencies = queryAll(`
      SELECT td.depends_on_task_id, dep.title, dep.column
      FROM task_dependencies td
      JOIN tasks dep ON dep.id = td.depends_on_task_id
      WHERE td.task_id = ?
    `, [id]);

    const evidences = queryAll(`
      SELECT e.*
      FROM evidence e
      JOIN findings f ON f.id = e.finding_id
      WHERE f.project_id = ? AND e.content LIKE ?
    `, [task.project_id, `%${task.id}%`]);

    return {
      ...task,
      dependencies,
      evidences,
    };
  }

  static createTask(data: z.infer<typeof createTaskSchema>) {
    // Se dedup_key fornecida, checa existência prévia
    if (data.dedup_key) {
      const existing = queryOne<Task>('SELECT * FROM tasks WHERE dedup_key = ?', [data.dedup_key]);
      if (existing) {
        return existing; // Evita duplicação silenciosa
      }
    }

    const id = crypto.randomUUID();
    const criteriaJson = JSON.stringify(data.acceptance_criteria || []);

    return transaction(() => {
      execute(`
        INSERT INTO tasks (
          id, project_id, title, description, column, category, priority,
          severity, confidence, risk_level, requires_approval, assigned_agent,
          acceptance_criteria, dedup_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.project_id,
        data.title,
        data.description || '',
        data.column,
        data.category,
        data.priority,
        data.severity || 'INFO',
        data.confidence || 'UNVERIFIED',
        data.risk_level,
        data.requires_approval ? 1 : 0,
        data.assigned_agent || null,
        criteriaJson,
        data.dedup_key || null,
      ]);

      if (data.dependencies && data.dependencies.length > 0) {
        for (const depId of data.dependencies) {
          execute(`
            INSERT OR IGNORE INTO task_dependencies (id, task_id, depends_on_task_id)
            VALUES (?, ?, ?)
          `, [crypto.randomUUID(), id, depId]);
        }
      }

      return this.getTaskById(id);
    });
  }

  static moveTask(id: string, targetColumn: TaskColumn, justification?: string) {
    const task = this.getTaskById(id);
    if (!task) {
      throw new Error('Tarefa não encontrada');
    }

    // Regra 1: Não permitir mover para 'DONE' se houver dependências não concluídas
    if (targetColumn === 'DONE') {
      const pendingDeps = queryAll<{ title: string }>(`
        SELECT dep.title
        FROM task_dependencies td
        JOIN tasks dep ON dep.id = td.depends_on_task_id
        WHERE td.task_id = ? AND dep.column != 'DONE'
      `, [id]);

      if (pendingDeps.length > 0) {
        const depNames = pendingDeps.map(d => d.title).join(', ');
        throw new Error(`Não é possível concluir a tarefa. Dependências pendentes: ${depNames}`);
      }
    }

    // Regra 2: Se exige aprovação e está saindo de BACKLOG/TODO para IN_PROGRESS, verificar se foi aprovada
    if (task.requires_approval && (targetColumn === 'IN_PROGRESS' || targetColumn === 'DONE')) {
      const approved = queryOne<{ id: string }>(`
        SELECT id FROM approvals 
        WHERE task_id = ? AND status = 'APPROVED'
      `, [id]);
      if (!approved) {
        throw new Error('Esta tarefa exige aprovação prévia do operador para ser executada.');
      }
    }

    execute(`
      UPDATE tasks 
      SET column = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [targetColumn, id]);

    // Registra log de auditoria
    execute(`
      INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      'operator',
      'MOVE_TASK',
      'task',
      id,
      JSON.stringify({ from: task.column, to: targetColumn, justification: justification || 'Movimentação via Kanban' })
    ]);

    return this.getTaskById(id);
  }

  static updateTask(id: string, updates: Partial<Task>) {
    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return null;

    const fields: string[] = [];
    const params: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); params.push(updates.priority); }
    if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category); }
    if (updates.severity !== undefined) { fields.push('severity = ?'); params.push(updates.severity); }
    if (updates.confidence !== undefined) { fields.push('confidence = ?'); params.push(updates.confidence); }
    if (updates.risk_level !== undefined) { fields.push('risk_level = ?'); params.push(updates.risk_level); }
    if (updates.assigned_agent !== undefined) { fields.push('assigned_agent = ?'); params.push(updates.assigned_agent); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.getTaskById(id);
  }

  static deleteTask(id: string) {
    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) return false;

    execute('DELETE FROM tasks WHERE id = ?', [id]);
    return true;
  }
}
