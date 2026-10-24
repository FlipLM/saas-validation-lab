# 02 — STACK TECNOLÓGICA E JUSTIFICATIVAS TÉCNICAS

---

## 1. Avaliação do Ambiente de Hospedagem
- **Sistema Operacional**: Windows 11 / x64.
- **Node.js**: v24.19.0 (LTS moderna, suporte nativo a fetch, crypto, módulos ESM/CommonJS).
- **npm**: 11.17.0.
- **Docker Desktop**: Binários presentes, porém o Daemon não está em execução nesta estação de desenvolvimento.
  - *Decisão*: O sistema não pode depender do Docker rodando para suas funções essenciais (banco de dados, orquestrador, workers). O sistema deve operar de modo 100% nativo e autônomo, com adaptadores para Docker/PentAGI que checam conectividade de forma não-bloqueante.

---

## 2. Tecnologias Selecionadas

### 2.1 Backend
- **Node.js + TypeScript**: Tipagem estrita de ponta a ponta (`strict: true`), estabilidade em tempo de execução e alta concorrência com Event Loop.
- **Fastify / Express**: API REST com middleware de segurança (Helmet, CORS restrito, validação de esquema de entrada com Zod).
- **SQLite (better-sqlite3 / sqlite3) com modo WAL (Write-Ahead Logging)**:
  - *Justificativa*: Zero dependência de daemons externos; performance extrema em leituras concorrentes; suporte a transações ACID seguras; dados persistidos em um arquivo físico local (`data/saas_validator.db`).
  - *Migrabilidade*: Todas as tabelas são modeladas com tipos canônicos ANSI SQL, permitindo migração limpa para PostgreSQL caso um servidor Postgres seja apontado via `DATABASE_URL`.
- **Fila Persistente Transacional (Native SQL Job Queue)**:
  - *Justificativa*: Elimina a necessidade de subir um servidor Redis (que consumiria memória extra e exigiria dependência externa). Assegura atomicidade com `BEGIN IMMEDIATE` / `UPDATE ... WHERE status = 'QUEUED' RETURNING ...` com suporte a timeouts e heartbeats de workers.

### 2.2 Frontend
- **React 18/19 com TypeScript**: Interfaces declarativas, seguras em tipos e de alta manutenibilidade.
- **Vite**: Build ultrarrápido, suporte nativo a HMR e geração de bundles otimizados.
- **Lucide Icons**: Iconografia SVG moderna e consistente.
- **TailwindCSS + CSS Tokens**: Paleta de cores escura (Dark Theme slate/indigo/emerald/rose), bordas sutis com glassmorphism, tipografia Inter e micro-animações interativas.
- **Axios / Native Fetch Typed Client**: Camada de serviço de API desacoplada com interceptores para mascaramento e tratamento padronizado de erros.

### 2.3 Testes
- **Vitest / Jest / Node Test Runner**: Testes unitários para regras de negócio, validador de evidências, orquestrador e adaptadores de integração.
- **Supertest**: Testes de rotas da API REST e controle de acesso RBAC.

### 2.4 Integrações Externas
- **Telegram Bot API**: Integração HTTPS oficial com retry exponencial e limitação de taxa (RFC / Telegram Bot API guidelines).
- **PentAGI**: Adaptador HTTP REST desacoplado que inspeciona a saúde do serviço PentAGI em tempo de execução sem bloquear o fluxo se o PentAGI estiver desligado.
