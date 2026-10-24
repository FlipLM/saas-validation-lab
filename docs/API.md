# API — CONTRATOS REST E ESPECIFICAÇÃO DE ENDPOINTS

Todos os endpoints utilizam formato JSON padrão, códigos HTTP semânticos (200, 201, 400, 401, 403, 404, 500) e validação de schema.

---

## 1. Endpoints de Projetos
- `GET /api/projects`: Lista projetos cadastrados com contadores de tarefas e status.
- `POST /api/projects`: Cadastra novo SaaS (campos: `name`, `description`, `target_url`, `repo_url`, `environment`, `auth_scope`).
- `GET /api/projects/:id`: Retorna detalhes do projeto, métricas, tarefas e relatórios.
- `PUT /api/projects/:id`: Atualiza dados do projeto e escopo autorizado.
- `DELETE /api/projects/:id`: Remove projeto e cascateia remoção de dados isolados.

## 2. Endpoints do Kanban e Tarefas
- `GET /api/tasks?projectId=:id`: Lista tarefas com filtros por coluna, categoria e prioridade.
- `POST /api/tasks`: Cria nova tarefa com critérios de aceite e chave de deduplicação.
- `PATCH /api/tasks/:id/move`: Movimenta tarefa de coluna no Kanban (`BACKLOG` -> `TODO` -> `IN_PROGRESS` -> `IN_REVIEW` -> `DONE`).
- `GET /api/tasks/:id`: Detalha tarefa, dependências, histórico e evidências vinculadas.

## 3. Endpoints do Checklist de Implantação
- `GET /api/checklist`: Retorna os itens de checklist agrupados pelas 18 categorias com percentual de progresso auditado.
- `PATCH /api/checklist/:id`: Atualiza status (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`) e anexa evidência obrigatória.

## 4. Endpoints de Execuções e Orquestrador
- `GET /api/executions`: Lista jobs da fila com status, tempos de execução e agente responsável.
- `POST /api/executions/trigger`: Dispara execução manual de agente ou tarefa.
- `POST /api/orchestrator/pause`: Pausa a distribuição global de automação.
- `POST /api/orchestrator/resume`: Retoma a automação global.

## 5. Endpoints de Integrações
- `GET /api/integrations`: Retorna estado das integrações (`pentagi`, `telegram`) com credenciais mascaradas.
- `POST /api/integrations/:id/test`: Executa teste real de conexão e atualiza o status.
- `PUT /api/integrations/:id`: Atualiza configurações da integração com mascaramento.

## 6. Endpoints de Relatórios
- `GET /api/reports?projectId=:id`: Lista relatórios gerados.
- `POST /api/reports/generate`: Consolida descobertas e evidências e gera relatório persistido (`report.md`, `report.json`, `findings.json`).
- `GET /api/reports/:id/download/:format`: Baixa relatório no formato solicitado (`md` ou `json`).

## 7. Endpoints de Aprovações
- `GET /api/approvals`: Lista operações sensíveis pendentes de autorização humana.
- `POST /api/approvals/:id/decide`: Registra decisão (`APPROVED`, `REJECTED`, `POSTPONED`) com notas do operador.

## 8. Endpoints de Diagnóstico e Saúde
- `GET /api/diagnostics/health`: Checagem atômica de integridade (Banco de Dados, Worker, Fila, PentAGI, Telegram, Memória e Uptime).
