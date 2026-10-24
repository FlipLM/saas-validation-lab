# ==============================================================================
# SAAS VALIDATION LAB - DOCKERFILE DE PRODUÇÃO MULTI-STAGE
# Otimizado para Coolify, VPS e Docker Compose
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Build da aplicação (Client SPA + Server TypeScript)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copia manifestos de dependências para cache de camadas
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instala todas as dependências (incluindo devDependencies necessárias para compilação)
RUN npm install

# Copia código-fonte completo
COPY server/ ./server/
COPY client/ ./client/

# Compila o backend (tsc) e frontend SPA (Vite)
RUN npm run build

# Limpa devDependencies mantendo apenas dependências de produção
RUN npm prune --production

# ------------------------------------------------------------------------------
# Estágio 2: Imagem final de execução de produção
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Instala curl para o Healthcheck do Docker e Coolify
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL=/app/data/saas_validator.db

# Cria diretório com permissões para o volume persistente do SQLite
RUN mkdir -p /app/data /app/data/backups

# Copia os manifestos e dependências prunadas
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/package*.json ./client/
COPY --from=builder /app/client/dist ./client/dist

# Declaração do volume persistente (crítico para Coolify reter dados do SQLite)
VOLUME ["/app/data"]

EXPOSE 3000

# Verificação contínua de saúde do contêiner
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

# Inicializa o SaaS Validation Lab
CMD ["npm", "run", "start"]
