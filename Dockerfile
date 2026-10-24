# ==============================================================================
# SAAS VALIDATION LAB - DOCKERFILE DE PRODUÇÃO MULTI-STAGE
# Otimizado para Coolify, VPS e Docker Compose
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Build da aplicação (Client SPA + Server TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Garante que dependências de desenvolvimento (tsc, vite, tipos) sejam instaladas
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

# Copia manifestos de dependências para cache de camadas
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instala todas as dependências (incluindo devDependencies)
RUN npm install --include=dev

# Copia código-fonte completo
COPY server/ ./server/
COPY client/ ./client/

# Compila o backend (tsc) e frontend SPA (Vite)
RUN npm run build

# ------------------------------------------------------------------------------
# Estágio 2: Imagem final de execução de produção (Debian glibc)
# ------------------------------------------------------------------------------
FROM node:22-slim AS runner

# Instala curl para diagnósticos
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL=/app/data/saas_validator.db

# Cria diretório com permissões para o volume persistente do SQLite
RUN mkdir -p /app/data /app/data/backups && chmod -R 777 /app/data

# Copia toda a aplicação já compilada com dependências intactas
COPY --from=builder /app ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Declaração do volume persistente (crítico para Coolify reter dados do SQLite)
VOLUME ["/app/data"]

EXPOSE 3000

# Inicializa o SaaS Validation Lab
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]

