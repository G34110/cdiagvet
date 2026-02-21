# =============================================================================
# Dockerfile - @cdiagvet/server (NestJS + Prisma + GraphQL)
# Simplified single-stage build
# =============================================================================

FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only server package files
COPY packages/server/package*.json ./

# Install ALL dependencies (need devDeps for build)
RUN npm install

# Copy source code
COPY packages/server/ ./

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Verify build output
RUN echo "=== BUILD OUTPUT ===" && ls -la dist/

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

LABEL maintainer="Gille"
LABEL description="CDiagVet API Server - NestJS + GraphQL + Prisma"

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copier le package.json
COPY packages/server/package.json ./

# Installer les dépendances
RUN npm install --omit=dev

# Copier Prisma et générer
COPY packages/server/prisma ./prisma
RUN npx prisma generate

# Copier le build (builder workdir is /app, dist is at /app/dist)
COPY --from=builder /app/dist ./dist

# Copier le script de démarrage
COPY packages/server/start.sh /start.sh
RUN chmod +x /start.sh

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads

# Utilisateur non-root (Debian syntax)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs && \
    chown -R nestjs:nodejs /app /start.sh

USER nestjs

EXPOSE 3000

# Utiliser le script de démarrage
CMD ["/start.sh"]