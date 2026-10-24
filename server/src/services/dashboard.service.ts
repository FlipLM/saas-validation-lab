import { queryAll, queryOne } from '../db/index.js';

export class DashboardService {
  static getStats() {
    // 1. Contadores de projetos
    const projectsTotal = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM projects')?.count || 0;
    const projectsInAudit = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE validation_status = 'IN_AUDIT'")?.count || 0;
    const projectsBlocked = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE validation_status = 'BLOCKED'")?.count || 0;

    // 2. Contadores de tarefas (Kanban)
    const tasksByColumn = queryAll<{ column: string; count: number }>(`
      SELECT column, COUNT(*) as count FROM tasks GROUP BY column
    `);
    const tasksSummary: Record<string, number> = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      BLOCKED: 0,
      DONE: 0,
    };
    for (const t of tasksByColumn) {
      tasksSummary[t.column] = t.count;
    }

    // 3. Contadores de Descobertas e Vulnerabilidades
    const findingsTotal = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM findings')?.count || 0;
    const confirmedVulnerabilities = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM findings WHERE is_confirmed_vulnerability = 1')?.count || 0;
    const findingsBySeverity = queryAll<{ severity: string; count: number }>(`
      SELECT severity, COUNT(*) as count FROM findings GROUP BY severity
    `);
    const severitySummary: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };
    for (const f of findingsBySeverity) {
      severitySummary[f.severity] = f.count;
    }

    // 4. Execuções e Workers
    const activeJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'RUNNING'")?.count || 0;
    const queuedJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'QUEUED'")?.count || 0;
    const failedJobs = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM execution_jobs WHERE status = 'FAILED'")?.count || 0;

    // 5. Checklist de Implantação
    const checklistTotal = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM checklist_items')?.count || 0;
    const checklistCompleted = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM checklist_items WHERE status = 'COMPLETED'")?.count || 0;
    const checklistProgressPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

    // 6. Integrações
    const integrations = queryAll<{ id: string; name: string; status: string }>('SELECT id, name, status FROM integrations');

    // 7. Aprovações Pendentes
    const pendingApprovals = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM approvals WHERE status = 'PENDING'")?.count || 0;

    // 8. Últimas Atividades / Tarefas recentes
    const recentTasks = queryAll(`
      SELECT t.id, t.title, t.column, t.priority, t.category, p.name as project_name, t.updated_at
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.updated_at DESC
      LIMIT 5
    `);

    return {
      projects: {
        total: projectsTotal,
        in_audit: projectsInAudit,
        blocked: projectsBlocked,
      },
      tasks: tasksSummary,
      findings: {
        total: findingsTotal,
        confirmed_vulnerabilities: confirmedVulnerabilities,
        by_severity: severitySummary,
      },
      executions: {
        active: activeJobs,
        queued: queuedJobs,
        failed: failedJobs,
      },
      checklist: {
        total: checklistTotal,
        completed: checklistCompleted,
        progress_percent: checklistProgressPercent,
      },
      integrations,
      pending_approvals: pendingApprovals,
      recent_tasks: recentTasks,
    };
  }
}
