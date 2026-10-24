# 00 — ARQUITETURA GERAL

---

## 1. Princípios Arquiteturais

1. **Separação de Preocupações (SoC)**:
   - **Frontend SPA**: Painel visual executivo, Kanban interativo, Checklist de implantação auditável, Central de relatórios, Configurações de risco e Aprovações.
   - **Backend API**: Endpoints REST seguros, RBAC, autenticação, controle de projetos, persistência de evidências e integridade relacional.
   - **Orquestrador Autônomo**: Serviço daemon desacoplado do servidor HTTP, responsável por avaliar tarefas pendentes, checar dependências, verificar aprovações manuais e despachar tarefas para a fila.
   - **Worker Independente**: Processo assíncrono que consome a fila persistente, executa agentes com timeouts estritos e heartbeats, e armazena os resultados no banco de dados.
   - **Validador Independente**: Agente de validação compulsória de evidências que atua como barreira antes que qualquer descoberta seja classificada como vulnerabilidade ou fato confirmado.

2. **Hierarquia de Execução e Resiliência**:
```text
[Usuário / Web UI] ──(HTTP/REST)──> [Backend API Server] ──(SQL ACID)──> [Banco SQLite WAL / Postgres]
                                                                                   │
                                                                                   ▼
[Orquestrador Daemon] <──(Avalia dependências & Kanban & Aprovações)──────── [Tabelas de Tarefas]
        │
        ▼ (Enfileira)
[Fila Persistente (execution_jobs)] ◄──────────────────────────────────────────────┘
        │
        ▼ (Consome com lock transacional)
[Worker Daemon] ────> Executa Agente Especializado
                            │
                            ├──> Coleta Evidências Rastreáveis
                            ├──> Submete para o Independent Evidence Validator
                            ├──> Grava Resultados, Descobertas e Logs Estruturados
                            └──> Notifica via Telegram Bot Adapter (se ativado)
```

3. **Operação Fora da Sessão do IDE / Antigravity**:
   - Os serviços de backend, orquestrador e workers são processos Node.js padrão com scripts dedicados (`npm run dev:server`, `npm run dev:worker`, `npm run dev:orchestrator` ou `npm run start:all`).
   - A persistência é realizada em disco físico (`data/saas_validator.db`), sobrevivendo a reinicializações de máquina e interrupções de conexão.

4. **Isolamento de Escopo e Segurança por Padrão**:
   - Cada projeto SaaS cadastrado possui seu próprio ID e isolamento rigoroso de escopo (`target_url`, `allowed_domains`, `auth_scope`, `rate_limit_per_minute`).
   - Nenhuma requisição ou varredura de agente pode ultrapassar o escopo declarado no cadastro do projeto.
   - Operações de risco elevado (testes ofensivos, testes invasivos, ações com custo) entram automaticamente no estado `WAITING_APPROVAL` até deliberação do operador.
