import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { Project, Task } from '../types/index.js';
import { ReportService } from './report.service.js';
import crypto from 'node:crypto';

export interface OrchestratorStatus {
  projectId: string;
  projectName: string;
  counts: {
    backlog: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
    blocked: number;
    pending_approvals: number;
  };
  automationPaused: boolean;
  recommendation: string;
}

export class OrchestratorControlService {
  static getStatus(projectId?: string): OrchestratorStatus {
    const project = projectId 
      ? queryOne<Project>('SELECT * FROM projects WHERE id = ?', [projectId])
      : queryOne<Project>('SELECT * FROM projects ORDER BY created_at ASC LIMIT 1');

    const effectiveProjectId = project?.id || '';
    const projectName = project?.name || 'Projeto Desconhecido';

    const tasks = queryAll<Task>('SELECT * FROM tasks WHERE project_id = ?', [effectiveProjectId]);
    const approvals = queryAll<{ id: string }>('SELECT id FROM approvals WHERE status = ?', ['PENDING']);
    const pauseSetting = queryOne<{ value: string }>('SELECT value FROM policy_settings WHERE key = ?', ['GLOBAL_AUTOMATION_PAUSED']);

    const counts = {
      backlog: tasks.filter(t => t.column === 'BACKLOG').length,
      todo: tasks.filter(t => t.column === 'TODO').length,
      in_progress: tasks.filter(t => t.column === 'IN_PROGRESS').length,
      in_review: tasks.filter(t => t.column === 'IN_REVIEW').length,
      done: tasks.filter(t => t.column === 'DONE').length,
      blocked: tasks.filter(t => t.column === 'BLOCKED').length,
      pending_approvals: approvals.length,
    };

    let recommendation = 'O orquestrador está aguardando novas tarefas na coluna TODO.';
    if (counts.todo > 0 || counts.in_progress > 0) {
      recommendation = `Orquestrador em operação ativa: ${counts.in_progress} em execução, ${counts.todo} na fila TODO.`;
    } else if (counts.in_review > 0) {
      recommendation = `${counts.in_review} tarefas em revisão após análise dos agentes. Você pode aprovar tudo (DONE) ou gerar tarefas de correção.`;
    } else if (counts.backlog > 0 && counts.pending_approvals > 0) {
      recommendation = `Existe ${counts.pending_approvals} aprovação pendente no Backlog (ex: Teste de Carga/Estresse).`;
    }

    return {
      projectId: effectiveProjectId,
      projectName,
      counts,
      automationPaused: pauseSetting?.value === 'true',
      recommendation,
    };
  }

  static async executeDecision(action: string, explicitProjectId?: string): Promise<{ success: boolean; message: string; details?: any }> {
    const project = explicitProjectId 
      ? queryOne<Project>('SELECT * FROM projects WHERE id = ?', [explicitProjectId])
      : queryOne<Project>('SELECT * FROM projects ORDER BY created_at ASC LIMIT 1');

    if (!project) {
      return { success: false, message: 'Nenhum projeto encontrado para aplicar a decisão.' };
    }
    const projectId = project.id;
    const cleanAction = action.replace(/^action:/, '').trim().toLowerCase();

    console.log(`[ORCHESTRATOR-CONTROL] Executando decisão "${cleanAction}" para o projeto ${project.name} (${projectId})`);

    switch (cleanAction) {
      case 'approve_stress': {
        // Encontra a tarefa de estresse ou que requer aprovação
        const targetTask = queryOne<Task>(`
          SELECT * FROM tasks 
          WHERE project_id = ? AND (requires_approval = 1 OR title LIKE '%Estresse%' OR title LIKE '%Carga%')
          LIMIT 1
        `, [projectId]);

        if (targetTask) {
          transaction(() => {
            execute(`
              UPDATE tasks 
              SET column = 'TODO', requires_approval = 0, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?
            `, [targetTask.id]);

            execute(`
              UPDATE approvals 
              SET status = 'APPROVED', approved_at = CURRENT_TIMESTAMP, approved_by = 'telegram_user'
              WHERE task_id = ? AND status = 'PENDING'
            `, [targetTask.id]);

            execute(`
              INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
              VALUES (?, 'orchestrator_decision', 'APPROVE_STRESS_TEST', 'task', ?, ?)
            `, [crypto.randomUUID(), targetTask.id, JSON.stringify({ authorizedBy: 'telegram_or_web' })]);
          });

          return {
            success: true,
            message: `🚀 Teste de Estresse e Carga autorizado com sucesso! A tarefa "${targetTask.title}" foi movida para TODO e o Orquestrador iniciará a execução imediatamente.`,
          };
        } else {
          return {
            success: true,
            message: 'Nenhuma tarefa pendente de aprovação ou teste de estresse foi encontrada no momento.',
          };
        }
      }

      case 'generate_fixes': {
        // Cria 4 tarefas de remediação diretamente em TODO para os agentes trabalharem
        const fixes = [
          {
            title: 'Implementação de Cabeçalhos HTTP de Segurança (HSTS, CSP, X-Frame-Options)',
            description: 'Configurar no Nginx/Reverse Proxy e middleware Express cabeçalhos Strict-Transport-Security (max-age=31536000), Content-Security-Policy com nonces e X-Content-Type-Options nos domínios do FisioteraHub.',
            category: 'SECURITY',
            priority: 'HIGH',
            severity: 'HIGH',
            assigned_agent: 'Web Recon Agent',
            acceptance_criteria: 'Headers HSTS e CSP validados com nota A no scanner de segurança HTTP.',
            dedup_key: `remediation_headers_${projectId}`,
          },
          {
            title: 'Trilha de Auditoria em Prontuários e Dados Clínicos (LGPD Art. 11)',
            description: 'Implementar tabela audit_clinical_access registrando ID do fisioterapeuta, paciente, timestamp, IP e tipo de leitura/alteração realizada, garantindo inviolabilidade de prontuários eletrônicos.',
            category: 'LEGAL',
            priority: 'HIGH',
            severity: 'HIGH',
            assigned_agent: 'Legal Research Analyst',
            acceptance_criteria: 'Toda consulta e alteração em prontuário gera log auditável persistente.',
            dedup_key: `remediation_audit_trail_${projectId}`,
          },
          {
            title: 'Política de Retenção e Guarda de Prontuários por 20 Anos (Lei 13.787/2018)',
            description: 'Garantir retenção mínima regulatória de 20 anos para prontuários em meio eletrônico e definir mecanismo de soft-delete com retenção probatória.',
            category: 'LEGAL',
            priority: 'MEDIUM',
            severity: 'MEDIUM',
            assigned_agent: 'Legal Research Analyst',
            acceptance_criteria: 'Prontuários nunca sofrem hard-delete físico antes de 20 anos.',
            dedup_key: `remediation_retention_20y_${projectId}`,
          },
          {
            title: 'Proteção de Concorrência e Rate Limiting em Rotas Sensíveis',
            description: 'Aplicar rate limiter por IP e por sessão nas rotas de login, recuperação de senha e disparo de lembretes via WhatsApp/SMS.',
            category: 'QA',
            priority: 'HIGH',
            severity: 'HIGH',
            assigned_agent: 'QA, Security & Reliability Agent',
            acceptance_criteria: 'Tentativas excedentes recebem HTTP 429 Too Many Requests com Retry-After.',
            dedup_key: `remediation_rate_limit_${projectId}`,
          },
        ];

        let createdCount = 0;
        transaction(() => {
          for (const fix of fixes) {
            const existing = queryOne('SELECT id FROM tasks WHERE dedup_key = ?', [fix.dedup_key]);
            if (existing) {
              execute(`
                UPDATE tasks 
                SET column = 'TODO', updated_at = CURRENT_TIMESTAMP 
                WHERE dedup_key = ?
              `, [fix.dedup_key]);
              createdCount++;
            } else {
              execute(`
                INSERT INTO tasks (
                  id, project_id, title, description, column, category, priority, 
                  severity, confidence, risk_level, requires_approval, assigned_agent, 
                  acceptance_criteria, dedup_key
                ) VALUES (?, ?, ?, ?, 'TODO', ?, ?, ?, 'VERIFIED', 'LOW', 0, ?, ?, ?)
              `, [
                crypto.randomUUID(),
                projectId,
                fix.title,
                fix.description,
                fix.category,
                fix.priority,
                fix.severity,
                fix.assigned_agent,
                fix.acceptance_criteria,
                fix.dedup_key,
              ]);
              createdCount++;
            }
          }

          execute(`
            INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
            VALUES (?, 'orchestrator_decision', 'GENERATE_REMEDIATION_TASKS', 'project', ?, ?)
          `, [crypto.randomUUID(), projectId, JSON.stringify({ createdTasks: createdCount })]);
        });

        return {
          success: true,
          message: `🛠️ ${createdCount} tarefas de correção e remediação foram inseridas na fila TODO. O Orquestrador já está delegando para os agentes autônomos!`,
        };
      }

      case 'promote_done': {
        const result = execute(`
          UPDATE tasks 
          SET column = 'DONE', updated_at = CURRENT_TIMESTAMP 
          WHERE project_id = ? AND column = 'IN_REVIEW'
        `, [projectId]);

        execute(`
          INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
          VALUES (?, 'orchestrator_decision', 'PROMOTE_ALL_DONE', 'project', ?, ?)
        `, [crypto.randomUUID(), projectId, JSON.stringify({ affected: result.changes })]);

        return {
          success: true,
          message: `✅ Todas as ${result.changes} tarefas em revisão foram homologadas e migradas para CONCLUÍDO (DONE).`,
        };
      }

      case 'rerun_audit': {
        transaction(() => {
          execute(`
            UPDATE tasks 
            SET column = 'TODO', updated_at = CURRENT_TIMESTAMP 
            WHERE project_id = ? AND column != 'DONE'
          `, [projectId]);

          // Limpa jobs presos em fila
          execute(`
            DELETE FROM execution_jobs 
            WHERE project_id = ? AND status IN ('QUEUED', 'WAITING_APPROVAL')
          `, [projectId]);

          execute(`
            INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
            VALUES (?, 'orchestrator_decision', 'RERUN_FULL_CYCLE', 'project', ?, ?)
          `, [crypto.randomUUID(), projectId, JSON.stringify({ resetAt: new Date().toISOString() })]);
        });

        return {
          success: true,
          message: `🔄 Ciclo reiniciado! As tarefas retornaram para a coluna TODO e serão executadas pelos agentes especialistas.`,
        };
      }

      case 'new_report': {
        const report = ReportService.generateReport(projectId);
        return {
          success: true,
          message: `📊 Novo Relatório Consolidado emitido com sucesso: "${report?.title || 'Relatório de Auditoria'}".`,
          details: { reportId: report?.id },
        };
      }

      default:
        return {
          success: false,
          message: `Ação "${action}" não reconhecida pelo Orquestrador.`,
        };
    }
  }
}
