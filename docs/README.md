# Índice de Documentação Técnica e Operacional

Bem-vindo à documentação oficial e memória permanente do **SaaS Validation Lab**.
Toda a documentação é orientada ao código real existente no repositório, em estrita obediência à Diretriz Global de Engenharia e às regras de não-invenção de dados.

---

## Estrutura dos Manuais Técnicos

1. [00_ARQUITETURA_GERAL.md](file:///g:/SaaS%20Validator/docs/00_ARQUITETURA_GERAL.md)
   - Visão lógica, componentes desacoplados, fluxo de dados e isolamento entre camadas.
2. [01_MAPA_DO_REPOSITORIO.md](file:///g:/SaaS%20Validator/docs/01_MAPA_DO_REPOSITORIO.md)
   - Mapeamento direto: "Onde encontrar cada funcionalidade, rota, controller, service e componente".
3. [02_STACK_TECNOLOGICA.md](file:///g:/SaaS%20Validator/docs/02_STACK_TECNOLOGICA.md)
   - Decisões técnicas, justificativas de engenharia e análise de capacidade do ambiente host.
4. [ROADMAP.md](file:///g:/SaaS%20Validator/docs/ROADMAP.md)
   - Fases da implementação (Fases 0 a 8), dependências, critérios de aceite e rastreabilidade.
5. [IMPLEMENTATION_STATUS.md](file:///g:/SaaS%20Validator/docs/IMPLEMENTATION_STATUS.md)
   - Matriz contínua de status comprovado (IMPLEMENTED_AND_TESTED, PARTIALLY_IMPLEMENTED, BLOCKED, etc.).
6. [SECURITY.md](file:///g:/SaaS%20Validator/docs/SECURITY.md)
   - Modelo de ameaças, RBAC, isolamento entre projetos, sanitização, defesa contra prompt injection e mascaramento de segredos.
7. [INTEGRATIONS.md](file:///g:/SaaS%20Validator/docs/INTEGRATIONS.md)
   - Adaptadores de integração real: PentAGI e Telegram. Estados de verificação e requisitos.
8. [AGENTS.md](file:///g:/SaaS%20Validator/docs/AGENTS.md)
   - Contratos de entrada e saída dos 11 agentes especializados + Independent Evidence Validator.
9. [ORCHESTRATOR.md](file:///g:/SaaS%20Validator/docs/ORCHESTRATOR.md)
   - Fila persistente, máquina de estados, transições válidas, heartbeats, detecção de tarefas órfãs e resiliência.
10. [DATABASE.md](file:///g:/SaaS%20Validator/docs/DATABASE.md)
    - Modelo relacional de entidades, migrações versionadas, integridade referencial e índices.
11. [API.md](file:///g:/SaaS%20Validator/docs/API.md)
    - Contratos REST da API (endpoints, payloads, códigos HTTP e autenticação).
12. [DEPLOYMENT.md](file:///g:/SaaS%20Validator/docs/DEPLOYMENT.md)
    - Procedimentos de instalação, inicialização de serviços, execução independente e variáveis de ambiente.
13. [OPERATIONS.md](file:///g:/SaaS%20Validator/docs/OPERATIONS.md)
    - Runbook operacional, backup do banco de dados, recuperação de desastres e diagnóstico.
14. [TESTING.md](file:///g:/SaaS%20Validator/docs/TESTING.md)
    - Testes unitários, testes de integração, testes de API e cobertura de segurança.
15. [LEGAL_COMPLIANCE.md](file:///g:/SaaS%20Validator/docs/LEGAL_COMPLIANCE.md)
    - Mapeamento de fontes legais oficiais (Planalto - LGPD, Lei 13.787/2018, ANPD) e metodologia de conformidade.
