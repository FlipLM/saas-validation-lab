# 01 — MAPA DO REPOSITÓRIO

Este documento orienta a manutenção por código. Antes de alterar qualquer funcionalidade, consulte as tabelas abaixo para localizar os arquivos responsáveis.

---

## 1. Mapeamento de Camadas e Módulos

| Funcionalidade / Domínio | Camada Frontend (client/) | Camada Backend / Rotas (server/) | Serviço de Domínio (server/src/services/) | Tabelas Relacionadas |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Geral** | `src/pages/Dashboard.tsx` | `GET /api/dashboard/stats` | `dashboard.service.ts` | `projects`, `tasks`, `findings`, `execution_jobs` |
| **Gestão de Projetos SaaS** | `src/pages/Projects.tsx` | `CRUD /api/projects` | `project.service.ts` | `projects`, `project_environments` |
| **Kanban Inteligente** | `src/pages/Kanban.tsx` | `CRUD /api/tasks`, `/api/tasks/:id/move` | `task.service.ts` | `tasks`, `task_dependencies`, `task_events` |
| **Checklist de Implantação** | `src/pages/Checklist.tsx` | `GET, PATCH /api/checklist` | `checklist.service.ts` | `checklist_items` |
| **Central de Integrações** | `src/pages/Integrations.tsx`| `GET, POST /api/integrations/test` | `integration.service.ts` | `integrations`, `integration_test_runs` |
| **Central de Relatórios** | `src/pages/Reports.tsx` | `GET, POST /api/reports` | `report.service.ts` | `reports`, `report_artifacts`, `findings` |
| **Execuções & Agentes** | `src/pages/Executions.tsx` | `GET, POST /api/executions` | `execution.service.ts` | `execution_jobs`, `agent_runs` |
| **Aprovações Operacionais** | `src/pages/Approvals.tsx` | `GET, POST /api/approvals/:id/decide` | `approval.service.ts` | `approvals`, `tasks`, `audit_logs` |
| **Configurações & Políticas** | `src/pages/Settings.tsx` | `GET, PUT /api/settings` | `settings.service.ts` | `policy_settings` |
| **Diagnóstico do Sistema** | `src/pages/Diagnostics.tsx` | `GET /api/diagnostics/health` | `diagnostics.service.ts` | Health checks de BD, Worker, APIs |

---

## 2. Componentes Específicos do Backend

- **Conexão e Migrações de BD**: `server/src/db/index.ts` e `server/src/db/migrations.ts`
- **Orquestrador Daemon**: `server/src/orchestrator/orchestrator.ts`
- **Worker Daemon**: `server/src/worker/worker.ts`
- **Motor de Execução de Agentes**: `server/src/agents/agent-runner.ts`
- **Validador Independente**: `server/src/agents/implementations/independent-validator.agent.ts`
- **Adaptador PentAGI**: `server/src/integrations/pentagi/pentagi-adapter.ts`
- **Adaptador Telegram**: `server/src/integrations/telegram/telegram-adapter.ts`
- **Middleware de Segurança & RBAC**: `server/src/security/auth.middleware.ts`
- **Auditoria & Anti-Tampering**: `server/src/security/audit.service.ts`

---

## 3. Guia de Manutenção Rápida ("Onde procurar")

- **"Quero alterar os critérios de aceite do checklist"**
  - Vá em: `server/src/db/seeds/checklist.seed.ts` e `client/src/pages/Checklist.tsx`.
- **"Quero alterar a máquina de estados das tarefas"**
  - Vá em: `server/src/types/task.types.ts` e `server/src/services/task.service.ts`.
- **"Quero adicionar uma nova verificação de segurança no PentAGI"**
  - Vá em: `server/src/integrations/pentagi/pentagi-adapter.ts`.
- **"Quero alterar as regras do Validador Independente de Evidências"**
  - Vá em: `server/src/agents/implementations/independent-validator.agent.ts`.
- **"Quero ajustar portas, variáveis ou contêiner para o Coolify/VPS"**
  - Vá em: `Dockerfile`, `docker-compose.yml` e `docs/COOLIFY.md`.
