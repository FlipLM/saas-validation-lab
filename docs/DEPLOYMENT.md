# DEPLOYMENT — GUIA DE IMPLANTAÇÃO E OPERAÇÃO CONTÍNUA

O **SaaS Validation Lab** foi projetado para operar com autonomia persistente fora da sessão de desenvolvimento, bastando que o ambiente hospedeiro permaneça ativo.

---

## Opções de Implantação Suportadas

1. **Coolify em VPS (Recomendado para Produção sem Domínio)**:
   - Consulte o guia completo e dedicado: [docs/COOLIFY.md](file:///g:/SaaS%20Validator/docs/COOLIFY.md).
   - Suporta HTTPS automático com *Magic Domain* gratuito (`sslip.io`) ou acesso direto via IP/porta da VPS.
   - Gerencia contêineres, SSL, reinício automático e monitoramento.

2. **Docker / Docker Compose**:
   - Implantação rápida em qualquer servidor Linux com Docker instalado:
     ```bash
     docker compose up -d
     ```
   - Utiliza a imagem multi-stage baseada em Alpine Node.js 22, com volume persistente `saas_data` para o banco SQLite WAL.

3. **Bare-Metal / PM2 (Sem Docker)**:
   - Execução direta com Node.js na máquina ou VPS.

---

## 1. Pré-Requisitos do Sistema
- Node.js >= 20.x (Recomendado Node.js 22.x).
- npm >= 10.x ou Docker / Docker Compose.
- Sistema Operacional: Linux (Ubuntu/Debian recomendado para VPS), Windows ou macOS.
- Espaço em disco mínimo: 500 MB para dados e evidências.
- Memória RAM mínima: 1 GB livre (o sistema consome ~150-250 MB em execução).

---

## 2. Passo a Passo de Instalação Local (Bare-Metal)

1. **Instalar dependências de todos os pacotes**:
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # No Windows PowerShell:
   Copy-Item .env.example .env
   ```
   Edite o arquivo `.env` para ajustar portas e tokens conforme desejado.

3. **Executar migrações do banco de dados SQLite WAL**:
   ```bash
   npm run db:migrate
   ```

4. **Inicializar o sistema de forma integrada**:
   - Modo de Desenvolvimento (Backend API + Frontend Vite + Worker/Orchestrator):
     ```bash
     npm run dev:server
     npm run dev:client
     ```
   - Modo de Produção Unificado (Porta 3000 servindo Frontend SPA + Backend API + Daemons):
     ```bash
     npm run build
     npm run start
     ```

---

## 3. Implantação com Docker e Docker Compose

O repositório já inclui um [Dockerfile](file:///g:/SaaS%20Validator/Dockerfile) de produção multi-stage e um [docker-compose.yml](file:///g:/SaaS%20Validator/docker-compose.yml).

### Subir os serviços em segundo plano:
```bash
docker compose up -d --build
```

### Verificar status e logs:
```bash
docker compose ps
docker compose logs -f
```

### Criar backup do banco de dados no contêiner:
```bash
docker compose exec saas-validator npm run db:backup
```

---

## 4. Execução Desacoplada com PM2 (Modo Avançado Bare-Metal)

Em servidores bare-metal onde não se deseja utilizar contêineres, os processos podem ser isolados com o PM2:

```bash
# Compilar projeto
npm run build

# Iniciar servidor web e API
pm2 start server/dist/index.js --name "saas-api"

# (Opcional) Se desabilitar os workers embutidos via ENABLE_EMBEDDED_WORKER=false:
pm2 start server/dist/orchestrator/orchestrator-daemon.js --name "saas-orchestrator"
pm2 start server/dist/worker/worker-daemon.js --name "saas-worker"

# Salvar lista para reinício automático do sistema operacional
pm2 save
pm2 startup
```

---

## 5. Matriz de Portas e Volumes

| Serviço | Porta Padrão | Variável de Ambiente | Volume / Diretório Persistente |
| :--- | :---: | :--- | :--- |
| **SaaS Validation Lab (All-in-One)** | `3000` | `PORT=3000` | `/app/data` (`saas_validator.db`, `/backups`) |
| **API Dev (Somente Backend)** | `3001` | `PORT=3001` | `data/` local |
| **Frontend Dev (Vite)** | `5173` | `VITE_PORT=5173` | N/A (Consome API via Proxy) |
