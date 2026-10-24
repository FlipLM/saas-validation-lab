# DATABASE — MODELO DE DOMÍNIO E PERSISTÊNCIA

O **SaaS Validation Lab** adota o SQLite no modo **WAL (Write-Ahead Logging)** com chaves estrangeiras ativas (`PRAGMA foreign_keys = ON;`), transações ACID e abstração de schema relacional ANSI SQL.

---

## 1. Esquema Relacional de Tabelas

### 1.1 `users`
Controle de operadores e administradores locais do sistema.
- `id` (TEXT, PK, UUIDv4)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL)
- `role` (TEXT, NOT NULL - `admin`, `auditor`, `viewer`)
- `created_at` (DATETIME, NOT NULL)
- `updated_at` (DATETIME, NOT NULL)

### 1.2 `projects`
Produtos SaaS submetidos à validação contínua e auditoria.
- `id` (TEXT, PK, UUIDv4)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `target_url` (TEXT, NOT NULL)
- `repo_url` (TEXT)
- `environment` (TEXT, NOT NULL - `development`, `staging`, `production`)
- `auth_scope` (TEXT, NOT NULL - JSON com escopo permitido, domínios, restrições)
- `validation_status` (TEXT, NOT NULL - `PENDING`, `IN_AUDIT`, `VALIDATED`, `BLOCKED`, `PAUSED`)
- `created_at` (DATETIME, NOT NULL)
- `updated_at` (DATETIME, NOT NULL)

### 1.3 `tasks` (Kanban Inteligente)
Tarefas de auditoria, hipóteses, correções e pesquisas jurídicas.
- `id` (TEXT, PK, UUIDv4)
- `project_id` (TEXT, NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `column` (TEXT, NOT NULL - `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE`)
- `category` (TEXT, NOT NULL - `SECURITY`, `ARCHITECTURE`, `QA`, `UX`, `LEGAL`, `GROWTH`, `PRODUCT`)
- `priority` (TEXT, NOT NULL - `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- `severity` (TEXT - `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`)
- `confidence` (TEXT - `CONFIRMED`, `HIGH`, `MEDIUM`, `SUSPECTED`, `UNVERIFIED`)
- `risk_level` (TEXT, NOT NULL - `LOW`, `MEDIUM`, `HIGH`, `EXTREME`)
- `requires_approval` (INTEGER, NOT NULL DEFAULT 0 - 0/1 booleano)
- `assigned_agent` (TEXT)
- `acceptance_criteria` (TEXT - JSON array de critérios)
- `dedup_key` (TEXT, UNIQUE - evita tarefas duplicadas)
- `attempts` (INTEGER NOT NULL DEFAULT 0)
- `created_at` (DATETIME, NOT NULL)
- `updated_at` (DATETIME, NOT NULL)

### 1.4 `task_dependencies`
Grafo de dependências entre tarefas.
- `id` (TEXT, PK, UUIDv4)
- `task_id` (TEXT, NOT NULL, FK -> `tasks.id` ON DELETE CASCADE)
- `depends_on_task_id` (TEXT, NOT NULL, FK -> `tasks.id` ON DELETE RESTRICT)
- `created_at` (DATETIME, NOT NULL)

### 1.5 `checklist_items`
Checklist de implantação auditável dividido em 18 categorias canônicas.
- `id` (TEXT, PK, UUIDv4)
- `category` (TEXT, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `status` (TEXT, NOT NULL - `PENDING`, `IN_PROGRESS`, `BLOCKED`, `FAILED`, `COMPLETED`)
- `assigned_to` (TEXT)
- `acceptance_criteria` (TEXT)
- `evidence_text` (TEXT)
- `updated_at` (DATETIME, NOT NULL)

### 1.6 `execution_jobs` (Fila Persistente)
Fila atômica de execuções dos workers.
- `id` (TEXT, PK, UUIDv4)
- `task_id` (TEXT, FK -> `tasks.id` ON DELETE SET NULL)
- `project_id` (TEXT, NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `agent_id` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL - `CREATED`, `QUEUED`, `RUNNING`, `WAITING_APPROVAL`, `WAITING_DEPENDENCY`, `RETRY_PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `BLOCKED`)
- `payload` (TEXT - JSON)
- `result` (TEXT - JSON)
- `error_message` (TEXT)
- `attempts` (INTEGER NOT NULL DEFAULT 0)
- `max_retries` (INTEGER NOT NULL DEFAULT 3)
- `heartbeat_at` (DATETIME)
- `started_at` (DATETIME)
- `finished_at` (DATETIME)
- `created_at` (DATETIME, NOT NULL)

### 1.7 `findings` (Descobertas e Vulnerabilidades)
- `id` (TEXT, PK, UUIDv4)
- `project_id` (TEXT, NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `execution_id` (TEXT, FK -> `execution_jobs.id` ON DELETE SET NULL)
- `agent_id` (TEXT, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `category` (TEXT, NOT NULL)
- `severity` (TEXT, NOT NULL - `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`)
- `confidence` (TEXT, NOT NULL - `CONFIRMED`, `HIGH`, `MEDIUM`, `SUSPECTED`, `UNVERIFIED`)
- `validation_status` (TEXT, NOT NULL - `PENDING_VALIDATION`, `VALIDATED`, `REJECTED`, `REPRODUCED`)
- `is_confirmed_vulnerability` (INTEGER NOT NULL DEFAULT 0)
- `recommendation` (TEXT)
- `created_at` (DATETIME, NOT NULL)

### 1.8 `evidence` (Evidências Rastreáveis)
- `id` (TEXT, PK, UUIDv4)
- `finding_id` (TEXT, FK -> `findings.id` ON DELETE CASCADE)
- `project_id` (TEXT, NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `agent_id` (TEXT, NOT NULL)
- `type` (TEXT, NOT NULL - `HTTP_REQUEST_RESPONSE`, `CODE_SNIPPET`, `LOG_OUTPUT`, `LEGAL_ARTICLE`, `DOM_SNAPSHOT`)
- `category` (TEXT, NOT NULL - `OBSERVED`, `REPRODUCED`, `CORROBORATED`, `INFERRED`, `UNVERIFIED`, `REJECTED`)
- `source_url` (TEXT)
- `content` (TEXT, NOT NULL)
- `sha256_hash` (TEXT, NOT NULL)
- `validation_notes` (TEXT)
- `created_at` (DATETIME, NOT NULL)

### 1.9 `reports` & `report_artifacts`
Relatórios executivos e técnicos consolidados.
- `id` (TEXT, PK, UUIDv4)
- `project_id` (TEXT, NOT NULL, FK -> `projects.id` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `summary` (TEXT, NOT NULL)
- `scope` (TEXT)
- `methodology` (TEXT)
- `findings_count` (TEXT - JSON breakdown por severidade)
- `raw_content_md` (TEXT, NOT NULL)
- `created_at` (DATETIME, NOT NULL)

### 1.10 `integrations` & `integration_test_runs`
Configurações mascaradas e histórico de testes de conectividade.
- `id` (TEXT, PK - `telegram`, `pentagi`, etc.)
- `name` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL - `NOT_CONFIGURED`, `CONFIGURED`, `TESTING`, `TESTED`, `FAILED`, `BLOCKED`, `DISABLED`)
- `config_masked` (TEXT - JSON com credenciais mascaradas `***`)
- `last_test_at` (DATETIME)
- `last_error` (TEXT)
- `updated_at` (DATETIME, NOT NULL)

### 1.11 `approvals`
Decisões humanas para ações sensíveis de alto risco.
- `id` (TEXT, PK, UUIDv4)
- `task_id` (TEXT, FK -> `tasks.id`)
- `execution_id` (TEXT, FK -> `execution_jobs.id`)
- `operation_type` (TEXT, NOT NULL)
- `scope_requested` (TEXT, NOT NULL)
- `risk_assessment` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL - `PENDING`, `APPROVED`, `REJECTED`, `POSTPONED`)
- `decided_by` (TEXT)
- `decision_notes` (TEXT)
- `decided_at` (DATETIME)
- `created_at` (DATETIME, NOT NULL)

### 1.12 `audit_logs` & `policy_settings`
Rastreamento imutável de eventos operacionais e regras globais do orquestrador.
