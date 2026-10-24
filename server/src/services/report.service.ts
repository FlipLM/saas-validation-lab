import { queryAll, queryOne, execute } from '../db/index.js';
import { Report, Project, Finding, Task } from '../types/index.js';
import crypto from 'node:crypto';

export class ReportService {
  static listReports(projectId?: string) {
    let sql = `
      SELECT r.*, p.name as project_name
      FROM reports r
      JOIN projects p ON p.id = r.project_id
    `;
    const params: any[] = [];
    if (projectId) {
      sql += ' WHERE r.project_id = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY r.created_at DESC';
    return queryAll<Report & { project_name: string }>(sql, params);
  }

  static getReportById(id: string) {
    const report = queryOne<Report & { project_name: string }>(`
      SELECT r.*, p.name as project_name
      FROM reports r
      JOIN projects p ON p.id = r.project_id
      WHERE r.id = ?
    `, [id]);
    if (!report) return null;

    const findings = queryAll<Finding>(`
      SELECT * FROM findings WHERE project_id = ? ORDER BY severity, created_at DESC
    `, [report.project_id]);

    const tasks = queryAll<Task>(`
      SELECT * FROM tasks WHERE project_id = ? ORDER BY column, priority
    `, [report.project_id]);

    return {
      ...report,
      findings,
      tasks,
    };
  }

  static generateReport(projectId: string, title?: string) {
    const project = queryOne<Project>('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    const findings = queryAll<Finding>('SELECT * FROM findings WHERE project_id = ?', [projectId]);
    const tasks = queryAll<Task>('SELECT * FROM tasks WHERE project_id = ?', [projectId]);

    const findingsCount = {
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      info: findings.filter(f => f.severity === 'INFO').length,
    };

    const confirmedVulnerabilities = findings.filter(f => f.is_confirmed_vulnerability === 1);
    const unconfirmedFindings = findings.filter(f => f.is_confirmed_vulnerability === 0);

    const reportTitle = title || `Relatório de Auditoria SaaS - ${project.name} (${new Date().toLocaleDateString('pt-BR')})`;
    const reportId = crypto.randomUUID();

    // Gera documento consolidado em Markdown profissional
    const markdownContent = `
# ${reportTitle}
**Data de Emissão**: ${new Date().toISOString()}  
**Projeto Alvo**: ${project.name}  
**URL de Escopo**: ${project.target_url}  
**Ambiente**: ${project.environment.toUpperCase()}  

---

## 1. Resumo Executivo
Este relatório consolida os resultados da auditoria autônoma executada pelo **SaaS Validation Lab**.
- **Total de Descobertas Identificadas**: ${findings.length}
- **Vulnerabilidades Confirmadas**: ${confirmedVulnerabilities.length}
- **Descobertas em Validação / Não Confirmadas**: ${unconfirmedFindings.length}
- **Severidade**: ${findingsCount.critical} Crítica(s), ${findingsCount.high} Alta(s), ${findingsCount.medium} Média(s), ${findingsCount.low} Baixa(s).

---

## 2. Metodologia e Escopo
A avaliação foi orientada por evidências rastreáveis e validação independente (Independent Evidence Validator).
- **Escopo Autorizado**: ${project.auth_scope}
- **Limitações do Teste**: Ações de alto risco foram submetidas ao fluxo de aprovação prévia. Nenhuma ação invasiva não autorizada foi realizada.

---

## 3. Vulnerabilidades e Descobertas Confirmadas
${confirmedVulnerabilities.length === 0 ? '_Nenhuma vulnerabilidade confirmada até o momento._' : ''}
${confirmedVulnerabilities.map(f => `
### [${f.severity}] ${f.title}
- **Categoria**: ${f.category}
- **Confiança**: ${f.confidence}
- **Descrição**: ${f.description}
- **Recomendação**: ${f.recommendation || 'Aplicar correção e executar teste de regressão.'}
`).join('\n')}

---

## 4. Descobertas Suspeitas / Pendentes de Confirmação
${unconfirmedFindings.length === 0 ? '_Nenhuma descoberta pendente._' : ''}
${unconfirmedFindings.map(f => `
- **[${f.severity}] ${f.title}** (${f.category}) - Status: \`${f.validation_status}\`
`).join('\n')}

---

## 5. Tarefas de Evolução e Próximas Ações (Kanban)
- **Tarefas Concluídas**: ${tasks.filter(t => t.column === 'DONE').length}
- **Tarefas em Andamento**: ${tasks.filter(t => t.column === 'IN_PROGRESS').length}
- **Tarefas Bloqueadas**: ${tasks.filter(t => t.column === 'BLOCKED').length}
- **Backlog**: ${tasks.filter(t => t.column === 'BACKLOG' || t.column === 'TODO').length}
    `.trim();

    const summaryText = `Auditoria de ${project.name}: ${confirmedVulnerabilities.length} vulnerabilidade(s) confirmada(s), ${findings.length} achados totais e ${tasks.length} tarefas vinculadas.`;

    execute(`
      INSERT INTO reports (id, project_id, title, summary, scope, methodology, findings_count, raw_content_md)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportId,
      projectId,
      reportTitle,
      summaryText,
      project.target_url,
      'Metodologia de Auditoria Autônoma com Validação Independente',
      JSON.stringify(findingsCount),
      markdownContent,
    ]);

    return this.getReportById(reportId);
  }
}
