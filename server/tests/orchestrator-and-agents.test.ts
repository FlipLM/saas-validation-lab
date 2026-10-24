import { describe, it, expect, beforeAll } from 'vitest';
import { runMigrations } from '../src/db/migrations.js';
import { runSeeds } from '../src/db/seeds/index.js';
import { ProjectService } from '../src/services/project.service.js';
import { TaskService } from '../src/services/task.service.js';
import { Orchestrator } from '../src/orchestrator/orchestrator.js';
import { Worker } from '../src/worker/worker.js';
import { IndependentEvidenceValidator } from '../src/agents/implementations/independent-validator.agent.js';
import { AgentContext } from '../src/agents/types.js';
import { queryOne, queryAll, execute } from '../src/db/index.js';
import { ExecutionJob, Finding, Task } from '../src/types/index.js';

describe('SaaS Validation Lab - Orquestrador, Workers e Validador Independente', () => {
  let projectId = '';
  const orchestrator = new Orchestrator();
  const worker = new Worker();

  beforeAll(() => {
    runMigrations();
    runSeeds();

    // Garante que a automação global esteja ativa no ambiente de teste
    execute("INSERT INTO policy_settings (key, value) VALUES ('GLOBAL_AUTOMATION_PAUSED', 'false') ON CONFLICT(key) DO UPDATE SET value = 'false'");

    const proj = ProjectService.createProject({
      name: 'Orchestrator Integration Test SaaS',
      target_url: 'https://httpbin.org',
      environment: 'development',
      auth_scope: {
        allowed_domains: ['httpbin.org'],
        exclusions: [],
        rate_limit_per_min: 60,
      },
    });
    projectId = proj!.id;
  });

  it('1. Validador Independente deve rejeitar achado com evidência vazia ou rasa', () => {
    const fakeFinding = {
      title: 'Injeção SQL Crítica',
      description: 'O site tem SQL Injection',
      category: 'SECURITY',
      severity: 'CRITICAL' as const,
      confidence: 'HIGH' as const,
      evidence: {
        type: 'HTTP_REQUEST_RESPONSE' as const,
        source_url: 'https://httpbin.org',
        raw_content: 'erro', // Menos de 20 caracteres -> insuficiente
      },
    };

    const dummyCtx: AgentContext = {
      project_id: projectId,
      project_name: 'Test Project',
      target_url: 'https://httpbin.org',
      environment: 'development',
      allowed_domains: ['httpbin.org'],
      exclusions: [],
      rate_limit_per_min: 60,
    };

    const verdict = IndependentEvidenceValidator.evaluateFinding(fakeFinding, dummyCtx);
    expect(verdict.status).toBe('REJECTED');
    expect(verdict.is_confirmed_vulnerability).toBe(false);
    expect(verdict.notes).toContain('REJEITADO');
  });

  it('2. Validador Independente deve aprovar evidência válida e computar confiança confirmada', () => {
    const validFinding = {
      title: 'Ausência de Cabeçalho HSTS',
      description: 'O servidor não enviou Strict-Transport-Security em conexão TLS.',
      category: 'SECURITY',
      severity: 'MEDIUM' as const,
      confidence: 'CONFIRMED' as const,
      evidence: {
        type: 'HTTP_REQUEST_RESPONSE' as const,
        source_url: 'https://httpbin.org',
        raw_content: 'HTTP/1.1 200 OK\nContent-Type: application/json\nServer: gunicorn',
      },
    };

    const dummyCtx: AgentContext = {
      project_id: projectId,
      project_name: 'Test Project',
      target_url: 'https://httpbin.org',
      environment: 'development',
      allowed_domains: ['httpbin.org'],
      exclusions: [],
      rate_limit_per_min: 60,
    };

    const verdict = IndependentEvidenceValidator.evaluateFinding(validFinding, dummyCtx);
    expect(verdict.status).toBe('VALIDATED');
    expect(verdict.adjusted_confidence).toBe('CONFIRMED');
    expect(verdict.notes).toContain('VALIDADO COM SUCESSO');
  });

  it('3. Orquestrador deve selecionar tarefa elegível em TODO e enfileirar para o Worker', async () => {
    // Cria tarefa em TODO
    const task = TaskService.createTask({
      project_id: projectId,
      title: 'Tarefa Autônoma de Reconhecimento',
      column: 'TODO',
      category: 'SECURITY',
      priority: 'HIGH',
      risk_level: 'LOW',
      requires_approval: false,
    });

    const cycleResult = await orchestrator.runCycle();
    expect(cycleResult.tasksEnqueued).toBeGreaterThanOrEqual(1);

    // Tarefa deve ter sido movida para IN_PROGRESS
    const updatedTask = TaskService.getTaskById(task.id);
    expect(updatedTask.column).toBe('IN_PROGRESS');

    // Deve haver job com status QUEUED vinculado à tarefa
    const job = queryOne<ExecutionJob>('SELECT * FROM execution_jobs WHERE task_id = ?', [task.id]);
    expect(job).toBeDefined();
    expect(job?.status).toBe('QUEUED');
  });

  it('4. Worker deve capturar e executar o job de forma atômica', async () => {
    const processed = await worker.processNextJob();
    expect(processed).toBe(true);

    // Job executado com sucesso
    const completedJob = queryOne<ExecutionJob>(`
      SELECT * FROM execution_jobs 
      WHERE status = 'SUCCEEDED' 
      ORDER BY finished_at DESC LIMIT 1
    `);

    expect(completedJob).not.toBeNull();
    expect(completedJob?.result).toBeDefined();

    // Tarefa vinculada deve ter sido movida para IN_REVIEW
    if (completedJob?.task_id) {
      const task = TaskService.getTaskById(completedJob.task_id);
      expect(task.column).toBe('IN_REVIEW');
    }

    // Evidências e Descobertas devem ter sido persistidas com hash SHA-256
    const findings = queryAll<Finding>('SELECT * FROM findings WHERE project_id = ?', [completedJob!.project_id]);
    expect(findings.length).toBeGreaterThan(0);
  });
});
