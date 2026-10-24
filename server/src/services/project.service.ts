import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { Project } from '../types/index.js';
import crypto from 'node:crypto';
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().default(''),
  target_url: z.string().url(),
  repo_url: z.string().url().optional().or(z.literal('')),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  auth_scope: z.object({
    allowed_domains: z.array(z.string()).default([]),
    exclusions: z.array(z.string()).default([]),
    rate_limit_per_min: z.number().int().positive().default(60),
    notes: z.string().optional()
  }).optional(),
});

export class ProjectService {
  static listProjects() {
    return queryAll<Project & { tasks_count: number; findings_count: number }>(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as tasks_count,
        (SELECT COUNT(*) FROM findings f WHERE f.project_id = p.id) as findings_count
      FROM projects p
      ORDER BY p.created_at DESC
    `);
  }

  static getProjectById(id: string) {
    const project = queryOne<Project>('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return null;

    const environments = queryAll('SELECT * FROM project_environments WHERE project_id = ?', [id]);
    const recentTasks = queryAll('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC LIMIT 10', [id]);
    const recentFindings = queryAll('SELECT * FROM findings WHERE project_id = ? ORDER BY created_at DESC LIMIT 10', [id]);

    return {
      ...project,
      environments,
      recent_tasks: recentTasks,
      recent_findings: recentFindings,
    };
  }

  static createProject(data: z.infer<typeof createProjectSchema>) {
    const id = crypto.randomUUID();
    const urlObj = new URL(data.target_url);
    
    // Auto-preenche o domínio alvo se a lista de allowed_domains estiver vazia
    const scope = data.auth_scope || {
      allowed_domains: [urlObj.hostname],
      exclusions: [],
      rate_limit_per_min: 60,
    };
    if (!scope.allowed_domains.includes(urlObj.hostname)) {
      scope.allowed_domains.push(urlObj.hostname);
    }

    const scopeJson = JSON.stringify(scope);

    execute(`
      INSERT INTO projects (id, name, description, target_url, repo_url, environment, auth_scope, validation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      data.description || '',
      data.target_url,
      data.repo_url || null,
      data.environment,
      scopeJson,
      'PENDING',
    ]);

    return this.getProjectById(id);
  }

  static updateProject(id: string, data: Partial<z.infer<typeof createProjectSchema>> & { validation_status?: string }) {
    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
    if (data.target_url !== undefined) { updates.push('target_url = ?'); params.push(data.target_url); }
    if (data.repo_url !== undefined) { updates.push('repo_url = ?'); params.push(data.repo_url || null); }
    if (data.environment !== undefined) { updates.push('environment = ?'); params.push(data.environment); }
    if (data.auth_scope !== undefined) { updates.push('auth_scope = ?'); params.push(JSON.stringify(data.auth_scope)); }
    if (data.validation_status !== undefined) { updates.push('validation_status = ?'); params.push(data.validation_status); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    execute(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.getProjectById(id);
  }

  static deleteProject(id: string) {
    const existing = queryOne('SELECT * FROM projects WHERE id = ?', [id]);
    if (!existing) return false;

    execute('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  }
}
