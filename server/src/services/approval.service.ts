import { queryAll, queryOne, execute, transaction } from '../db/index.js';
import { Approval, ApprovalStatus } from '../types/index.js';
import crypto from 'node:crypto';

export class ApprovalService {
  static listApprovals(status?: ApprovalStatus) {
    let sql = `
      SELECT 
        a.*,
        t.title as task_title,
        t.risk_level,
        p.name as project_name
      FROM approvals a
      LEFT JOIN tasks t ON t.id = a.task_id
      LEFT JOIN projects p ON p.id = t.project_id
    `;
    const params: any[] = [];
    if (status) {
      sql += ' WHERE a.status = ?';
      params.push(status);
    }
    sql += " ORDER BY CASE a.status WHEN 'PENDING' THEN 1 ELSE 2 END, a.created_at DESC";
    return queryAll<Approval & { task_title?: string; risk_level?: string; project_name?: string }>(sql, params);
  }

  static createApprovalRequest(data: {
    task_id?: string;
    execution_id?: string;
    operation_type: string;
    scope_requested: string;
    risk_assessment: string;
  }) {
    const id = crypto.randomUUID();
    execute(`
      INSERT INTO approvals (id, task_id, execution_id, operation_type, scope_requested, risk_assessment, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      id,
      data.task_id || null,
      data.execution_id || null,
      data.operation_type,
      data.scope_requested,
      data.risk_assessment,
    ]);

    return queryOne<Approval>('SELECT * FROM approvals WHERE id = ?', [id]);
  }

  static decide(id: string, decision: 'APPROVED' | 'REJECTED' | 'POSTPONED', decidedBy = 'Operador Humano', notes = '') {
    const approval = queryOne<Approval>('SELECT * FROM approvals WHERE id = ?', [id]);
    if (!approval) {
      throw new Error('Solicitação de aprovação não encontrada');
    }

    return transaction(() => {
      execute(`
        UPDATE approvals
        SET status = ?, decided_by = ?, decision_notes = ?, decided_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [decision, decidedBy, notes, id]);

      // Se a aprovação estava vinculada a uma tarefa e foi aprovada, e a tarefa estava bloqueada aguardando aprovação
      if (approval.task_id) {
        if (decision === 'APPROVED') {
          // Atualiza status da tarefa para TODO ou IN_PROGRESS se estiver pronta
          execute(`
            UPDATE tasks 
            SET column = 'TODO', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND column = 'BACKLOG'
          `, [approval.task_id]);
        } else if (decision === 'REJECTED') {
          execute(`
            UPDATE tasks 
            SET column = 'BLOCKED', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [approval.task_id]);
        }
      }

      // Se havia um execution_job aguardando aprovação
      if (approval.execution_id) {
        if (decision === 'APPROVED') {
          execute(`
            UPDATE execution_jobs
            SET status = 'QUEUED'
            WHERE id = ? AND status = 'WAITING_APPROVAL'
          `, [approval.execution_id]);
        } else if (decision === 'REJECTED') {
          execute(`
            UPDATE execution_jobs
            SET status = 'CANCELLED', error_message = 'Cancelado: Operação rejeitada pelo operador.'
            WHERE id = ? AND status = 'WAITING_APPROVAL'
          `, [approval.execution_id]);
        }
      }

      // Registra auditoria da decisão humana
      execute(`
        INSERT INTO audit_logs (id, actor, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        decidedBy,
        `APPROVAL_${decision}`,
        'approval',
        id,
        JSON.stringify({ notes, operation: approval.operation_type, scope: approval.scope_requested })
      ]);

      return queryOne<Approval>('SELECT * FROM approvals WHERE id = ?', [id]);
    });
  }
}
