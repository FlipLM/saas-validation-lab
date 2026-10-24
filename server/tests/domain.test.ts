import { describe, it, expect, beforeAll } from 'vitest';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds/index.js';
import { ProjectService } from '../src/services/project.service.js';
import { TaskService } from '../src/services/task.service.js';
import { ChecklistService } from '../src/services/checklist.service.js';
import { IntegrationService } from '../src/services/integration.service.js';
import { ApprovalService } from '../src/services/approval.service.js';
import { ReportService } from '../src/services/report.service.js';

describe('SaaS Validation Lab - Testes de Domínio e Regras de Negócio', () => {
  let testProjectId = '';

  beforeAll(() => {
    runMigrations();
    runSeeds();
  });

  it('1. Deve criar e isolar projetos SaaS com escopo validado', () => {
    const project = ProjectService.createProject({
      name: 'Test Target Project',
      description: 'Projeto de teste automatizado',
      target_url: 'https://app.testsaas.local',
      environment: 'development',
      auth_scope: {
        allowed_domains: ['app.testsaas.local'],
        exclusions: ['/admin'],
        rate_limit_per_min: 30,
      },
    });

    expect(project).toBeDefined();
    expect(project?.id).toBeDefined();
    expect(project?.name).toBe('Test Target Project');
    testProjectId = project!.id;
  });

  it('2. Deve criar tarefa no Kanban e impedir duplicação via dedup_key', () => {
    const task1 = TaskService.createTask({
      project_id: testProjectId,
      title: 'Tarefa Deduplicada',
      description: 'Teste de integridade de tarefas',
      column: 'BACKLOG',
      category: 'SECURITY',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: false,
      dedup_key: 'dedup-test-key-123',
    });

    const task2 = TaskService.createTask({
      project_id: testProjectId,
      title: 'Tentativa Duplicada',
      description: 'Não deve criar segundo registro',
      column: 'BACKLOG',
      category: 'SECURITY',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: false,
      dedup_key: 'dedup-test-key-123',
    });

    expect(task1.id).toBe(task2.id);
  });

  it('3. Deve bloquear a conclusão de tarefa (DONE) se houver dependências pendentes', () => {
    // Tarefa dependência A (em BACKLOG)
    const taskA = TaskService.createTask({
      project_id: testProjectId,
      title: 'Dependência Prévia',
      column: 'BACKLOG',
      category: 'ARCHITECTURE',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: false,
    });

    // Tarefa principal B (depende de A)
    const taskB = TaskService.createTask({
      project_id: testProjectId,
      title: 'Tarefa Dependente',
      column: 'IN_PROGRESS',
      category: 'ARCHITECTURE',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: false,
      dependencies: [taskA.id],
    });

    // Tentativa de mover taskB diretamente para DONE deve falhar
    expect(() => {
      TaskService.moveTask(taskB.id, 'DONE');
    }).toThrow(/Dependências pendentes/);

    // Conclui taskA primeiro
    TaskService.moveTask(taskA.id, 'DONE');

    // Agora taskB pode ser concluída com sucesso
    const completedB = TaskService.moveTask(taskB.id, 'DONE');
    expect(completedB.column).toBe('DONE');
  });

  it('4. Deve exigir evidência concreta de conclusão para marcar item de Checklist como COMPLETED', () => {
    const items = ChecklistService.listAll().raw_items;
    const testItem = items[0];

    // Tentativa de marcar COMPLETED sem evidência deve falhar
    expect(() => {
      ChecklistService.updateItem(testItem.id, {
        status: 'COMPLETED',
        evidence_text: '',
      });
    }).toThrow(/exige evidência concreta/);

    // Com evidência suficiente, deve ser aprovado
    const updated = ChecklistService.updateItem(testItem.id, {
      status: 'COMPLETED',
      evidence_text: 'Evidência técnica auditada: logs validados em testes unitários.',
    });
    expect(updated?.status).toBe('COMPLETED');
  });

  it('5. Deve gerenciar aprovações humanas para ações de alto risco', () => {
    const approval = ApprovalService.createApprovalRequest({
      operation_type: 'INVASIVE_RATE_LIMIT_TEST',
      scope_requested: 'https://app.testsaas.local/api/login',
      risk_assessment: 'Risco de bloqueio temporário de IP no alvo',
    });

    expect(approval?.status).toBe('PENDING');

    const decided = ApprovalService.decide(approval!.id, 'APPROVED', 'Security Lead', 'Operação autorizada para janela noturna');
    expect(decided?.status).toBe('APPROVED');
    expect(decided?.decided_by).toBe('Security Lead');
  });

  it('6. Deve mascarar rigorosamente credenciais de integração', () => {
    IntegrationService.updateConfig('telegram', {
      bot_token: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_secret_key',
      chat_id: '987654321',
      enabled: true,
    });

    const list = IntegrationService.listIntegrations();
    const telegram = list.find(i => i.id === 'telegram');
    expect(telegram).toBeDefined();
    expect(telegram?.config.bot_token).not.toContain('secret_key');
    expect(telegram?.config.bot_token).toContain('****');
  });

  it('7. Deve consolidar descobertas e gerar relatório persistido em Markdown', () => {
    const report = ReportService.generateReport(testProjectId, 'Relatório de Teste Automatizado');
    expect(report).toBeDefined();
    expect(report?.title).toBe('Relatório de Teste Automatizado');
    expect(report?.raw_content_md).toContain('Resumo Executivo');
    expect(report?.raw_content_md).toContain('Test Target Project');
  });
});
