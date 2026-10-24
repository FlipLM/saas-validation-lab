# OPERATIONS — RUNBOOK OPERACIONAL, BACKUP E RECUPERAÇÃO

---

## 1. Rotinas de Backup e Restauração

### 1.1 Backup a Quente do Banco de Dados (Online SQLite WAL Backup)
O SQLite em modo WAL permite cópia atômica consistente sem parar a aplicação:
- Comando de backup no servidor:
  ```bash
  # Via Node script integrado:
  npm run db:backup
  ```
- O script executa o comando SQLite `.backup` criando um snapshot consistente em `data/backups/saas_validator_YYYYMMDD_HHMMSS.db`.

### 1.2 Restauração de Desastres (Disaster Recovery)
1. Interrompa os serviços ativos (`npm run stop` ou encerre os processos node).
2. Substitua o arquivo `data/saas_validator.db` pelo snapshot desejado.
3. Remova quaisquer arquivos temporários residuais `data/saas_validator.db-wal` e `data/saas_validator.db-shm`.
4. Reinicie os serviços (`npm run start`). O orquestrador detectará automaticamente jobs órfãos que estavam `RUNNING` no momento da interrupção e os colocará em `RETRY_PENDING`.

---

## 2. Monitoramento de Saúde Operacional
Acesse a rota `GET /api/diagnostics/health` ou a tela **Diagnóstico** no painel administrativo:
- **Banco de Dados**: Testa consulta simples e tempo de resposta em milissegundos.
- **Worker**: Verifica se o último heartbeat foi registrado nos últimos 30 segundos.
- **Fila de Execuções**: Quantidade de jobs em fila, em execução e falhos.
- **Integrações**: Status comprovado da última checagem de PentAGI e Telegram.
