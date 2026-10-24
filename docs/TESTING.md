# TESTING — ESTRATÉGIA DE TESTES E COBERTURA

O SaaS Validation Lab implementa testes automatizados para assegurar confiabilidade e prevenir regressões.

---

## 1. Níveis de Teste

### 1.1 Testes Unitários de Domínio
- **Validador Independente de Evidências**: Testa a aprovação de evidências sólidas e a rejeição de inferências vazias ou sem fonte.
- **Máquina de Estados de Tarefas**: Testa transições proibidas (ex: mover de `BACKLOG` direto para `DONE` sem passar por `IN_REVIEW` e critérios atendidos).
- **Cálculo de Dependências**: Testa bloqueio de tarefas cujas dependências ainda estão em aberto.

### 1.2 Testes de Integração de API
- CRUD de Projetos com validação de escopo.
- Movimentação de cartões Kanban e persistência em banco.
- Checagem do checklist e cálculo de progresso auditado.
- Mascaramento rigoroso de credenciais nas rotas de integração.

### 1.3 Execução dos Testes
```bash
npm run test
```
Para testes com relatório de cobertura:
```bash
npm run test:coverage
```
