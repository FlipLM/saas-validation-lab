import { db } from './index.js';

export function runMigrations(): void {
  console.log('[DB] Executando migrações relacionais...');

  db.exec(`
    -- 1. Usuários e RBAC
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'auditor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Projetos SaaS sob Auditoria
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      target_url TEXT NOT NULL,
      repo_url TEXT,
      environment TEXT NOT NULL DEFAULT 'development',
      auth_scope TEXT NOT NULL DEFAULT '{"allowed_domains":[],"exclusions":[],"rate_limit_per_min":60}',
      validation_status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Ambientes Adicionais por Projeto
    CREATE TABLE IF NOT EXISTS project_environments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      auth_headers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Kanban de Tarefas e Hipóteses
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      column TEXT NOT NULL DEFAULT 'BACKLOG',
      category TEXT NOT NULL DEFAULT 'PRODUCT',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      severity TEXT DEFAULT 'INFO',
      confidence TEXT DEFAULT 'UNVERIFIED',
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      requires_approval INTEGER NOT NULL DEFAULT 0,
      assigned_agent TEXT,
      acceptance_criteria TEXT,
      dedup_key TEXT UNIQUE,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Grafo de Dependências entre Tarefas
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(task_id, depends_on_task_id)
    );

    -- 6. Checklist de Implantação Auditável
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      assigned_to TEXT,
      acceptance_criteria TEXT NOT NULL,
      evidence_text TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Fila Persistente de Execução (Orquestrador & Workers)
    CREATE TABLE IF NOT EXISTS execution_jobs (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      payload TEXT NOT NULL DEFAULT '{}',
      result TEXT,
      error_message TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      heartbeat_at DATETIME,
      started_at DATETIME,
      finished_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Descobertas e Vulnerabilidades (Auditoria & Validação)
    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      execution_id TEXT REFERENCES execution_jobs(id) ON DELETE SET NULL,
      agent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      confidence TEXT NOT NULL DEFAULT 'UNVERIFIED',
      validation_status TEXT NOT NULL DEFAULT 'PENDING_VALIDATION',
      is_confirmed_vulnerability INTEGER NOT NULL DEFAULT 0,
      recommendation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Evidências Rastreáveis com Hash Criptográfico
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      finding_id TEXT REFERENCES findings(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'OBSERVED',
      source_url TEXT,
      content TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      validation_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Relatórios Consolidados
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      scope TEXT,
      methodology TEXT,
      findings_count TEXT NOT NULL DEFAULT '{"critical":0,"high":0,"medium":0,"low":0,"info":0}',
      raw_content_md TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Central de Integrações
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
      config_masked TEXT NOT NULL DEFAULT '{}',
      config_secure TEXT NOT NULL DEFAULT '{}',
      last_test_at DATETIME,
      last_error TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );


    -- 12. Histórico de Testes de Integração
    CREATE TABLE IF NOT EXISTS integration_test_runs (
      id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      response_time_ms INTEGER,
      error_message TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Central de Aprovações de Ações Sensíveis
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      execution_id TEXT REFERENCES execution_jobs(id) ON DELETE SET NULL,
      operation_type TEXT NOT NULL,
      scope_requested TEXT NOT NULL,
      risk_assessment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      decided_by TEXT,
      decision_notes TEXT,
      decided_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. Logs de Auditoria & Políticas Globais
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Índices para Performance e Integridade
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, column);
    CREATE INDEX IF NOT EXISTS idx_tasks_dedup ON tasks(dedup_key);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON execution_jobs(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_findings_project ON findings(project_id, severity);
    CREATE INDEX IF NOT EXISTS idx_evidence_finding ON evidence(finding_id);
  `);

  try {
    db.exec("ALTER TABLE integrations ADD COLUMN config_secure TEXT NOT NULL DEFAULT '{}'");
  } catch {
    // Coluna já existe
  }

  console.log('[DB] Migrações concluídas com sucesso.');
}


// Executa diretamente se invocado via CLI
if (process.argv[1]?.endsWith('migrations.ts') || process.argv[1]?.endsWith('migrations.js')) {
  runMigrations();
}
