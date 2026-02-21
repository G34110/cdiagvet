# =============================================================================
# Dockerfile - @cdiagvet/server (NestJS + Prisma + GraphQL)
# Multi-stage build pour optimiser la taille de l'image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY packages/server/package.json ./packages/server/

# Installer les dépendances (incluant devDependencies pour le build)
RUN npm ci --workspace=@cdiagvet/server

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copier node_modules depuis deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copier le code source
COPY packages/server ./packages/server
COPY package.json ./

# Générer le client Prisma
WORKDIR /app/packages/server
RUN npx prisma generate

# Build NestJS
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production - ULTIME VERSION
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

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

# Copier le build
COPY --from=builder /app/packages/server/dist ./dist

# Copier le script de démarrage
COPY packages/server/start.sh /start.sh
RUN chmod +x /start.sh

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads

# Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app /start.sh

USER nestjs

EXPOSE 3000

# Utiliser le script de démarrage
CMD ["/start.sh"]