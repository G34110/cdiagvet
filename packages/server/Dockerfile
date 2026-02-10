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
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Métadonnées
LABEL maintainer="Gille"
LABEL description="CDiagVet API Server - NestJS + GraphQL + Prisma"

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Installer uniquement les dépendances de production
COPY packages/server/package.json ./
RUN npm install --omit=dev

# Copier les fichiers Prisma (schema + migrations)
COPY packages/server/prisma ./prisma

# Générer le client Prisma en production
RUN npx prisma generate

# Copier le build depuis le builder
COPY --from=builder /app/packages/server/dist ./dist

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Créer le dossier uploads avec les bonnes permissions
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Passer à l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Commande de démarrage
CMD ["node", "dist/main.js"]
