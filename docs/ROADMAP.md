# ROADMAP — FASES DE IMPLEMENTAÇÃO E CRITÉRIOS DE ACEITE

O desenvolvimento do SaaS Validation Lab é orientado a fases verificáveis e cumulativas, respeitando o princípio de não declarar pronto aquilo que não foi testado.

---

## Fase 0 — Inspeção do Ambiente e Planejamento Técnico
- [x] Inspecionar workspace e ferramentas do sistema host (Node v24.19.0, npm 11.17.0, status do Docker).
- [x] Elaborar arquitetura geral, decisões técnicas e plano de mitigação de riscos.
- [x] Criar estrutura de documentação em `docs/` e arquivos base do repositório (`README.md`, `.env.example`).
- **Critério de Aceite**: Plano documentado e versionado, sem dependências cegas de serviços indisponíveis.

---

## Fase 1 — Fundação, Banco de Dados, Backend API e Interface Visual
- [ ] Inicializar estrutura de monorepo / pacotes (`server/`, `client/`, `data/`).
- [ ] Implementar camada de banco de dados SQLite WAL com migrações tipadas e dados de inicialização (seeds).
- [ ] Desenvolver API REST segura (Autenticação, Projetos, Tarefas, Checklist, Integrações, Relatórios, Execuções, Aprovações, Configurações e Diagnósticos).
- [ ] Desenvolver Frontend SPA com design moderno (Dashboard com métricas reais, Gestão de Projetos, Kanban persistido, Checklist auditável, Central de Integrações com mascaramento, Central de Relatórios, Central de Aprovações e Painel de Diagnóstico).
- **Critério de Aceite**: Interface consome dados reais da API, dados persistem no banco após reiniciar o servidor, não há números falsos ou mocks estáticos disfarçados.

---

## Fase 2 — Orquestrador Autônomo e Workers
- [ ] Implementar máquina de estados finitos (`CREATED`, `QUEUED`, `RUNNING`, `WAITING_APPROVAL`, `WAITING_DEPENDENCY`, `RETRY_PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `BLOCKED`).
- [ ] Implementar fila de execução persistente no banco de dados com locks transacionais ACID.
- [ ] Implementar worker autônomo desacoplado com heartbeat e recuperação de tarefas abandonadas.
- [ ] Integrar motor do orquestrador com as colunas do Kanban e cálculo de dependências.
- [ ] Implementar mecanismo de pausa global de automação.
- **Critério de Aceite**: O worker roda como processo independente da interface; tarefas interrompidas abruptamente são detectadas e recuperadas.

---

## Fase 3 — Integração Real PentAGI
- [ ] Inspecionar contratos de API e requisitos do repositório vxcontrol/pentagi.
- [ ] Implementar adaptador de segurança PentAGI com validação de escopo, timeouts e tratamento de erros.
- [ ] Implementar health check de conectividade real.
- [ ] Documentar status (CONFIGURED / FAILED / BLOCKED se a infraestrutura PentAGI não estiver em execução).
- **Critério de Aceite**: O status do PentAGI reflete o estado real da conexão. Nunca declarar conectado se não houver resposta do serviço.

---

## Fase 4 — Integração Real Telegram Bot
- [ ] Implementar adaptador oficial da API de Bots do Telegram.
- [ ] Implementar envio de notificações de auditoria, alertas críticos e relatórios estruturados.
- [ ] Implementar mascaramento estrito de tokens e rastreamento de entregas na tabela `notification_deliveries`.
- **Critério de Aceite**: Status `TESTED` apenas após envio real com sucesso. Se não houver token, manter como `NOT_CONFIGURED`.

---

## Fase 5 — Camada de Agentes Especializados e Validador Independente
- [ ] Implementar contratos universais dos agentes (inputs, outputs, tools autorizadas, evidências).
- [ ] Implementar os 11 agentes especializados (Product Discovery, Competitive Intelligence, Web Recon, Market & Growth, Code Auditor, QA & Reliability, UX Recon, Release Readiness, Legal Research, Legal Compliance, e Independent Evidence Validator).
- [ ] Implementar barreira compulsória: nenhuma descoberta vira vulnerabilidade confirmada sem avaliação do Validador Independente.
- **Critério de Aceite**: O validador rejeita achados sem comprovação ou com confiança insuficiente.

---

## Fase 6 — Módulo de Pesquisa Jurídica e Conformidade
- [ ] Mapeamento e consulta a fontes oficiais brasileiras (Planalto: LGPD Lei 13.709/2018, Lei 13.787/2018 de prontuários eletrônicos, ANPD).
- [ ] Classificação estrita de requisitos (`APPLICABLE`, `POTENTIALLY_APPLICABLE`, `NEEDS_LEGAL_REVIEW`).
- [ ] Rastreabilidade com URLs oficiais e data de acesso.
- **Critério de Aceite**: O relatório jurídico deixa explícito que não substitui assessoria advocatícia e lista fontes reais.

---

## Fase 7 — Correções Controladas, Retestes e Liberação
- [ ] Fluxo de correção: achado validado -> tarefa gerada -> aprovação de escopo -> reteste obrigatório -> critérios de aceite.
- [ ] Geração de relatórios persistidos em múltiplos formatos (`report.md`, `report.json`, `findings.json`).
- **Critério de Aceite**: Nenhuma tarefa de correção é fechada sem teste de regressão aprovado.

---

## Fase 8 — Testes Automatizados, Resiliência e Operação Autônoma
- [ ] Suíte de testes automatizados (unitários, integração e API).
- [ ] Testes de recuperação após crash do processo (reinicialização do worker e reprocessamento).
- [ ] Validação de runbook de backup e restauração (`OPERATIONS.md`).
- **Critério de Aceite**: Todos os testes passando, documentação 100% alinhada com o código fonte.
