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
# Stage 3: Production - VERSION CORRIGÉE
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

LABEL maintainer="Gille"
LABEL description="CDiagVet API Server - NestJS + GraphQL + Prisma"

ENV NODE_ENV=production
ENV PORT=3000

# WORKDIR UNIQUE - tout sera à la racine /app
WORKDIR /app

# 1. Copier le package.json depuis le bon endroit
COPY packages/server/package.json ./

# 2. Installer les dépendances de production
RUN npm install --omit=dev

# 3. Copier les fichiers Prisma et générer le client
COPY packages/server/prisma ./prisma
RUN npx prisma generate

# 4. Copier le build depuis le builder - ATTENTION AU CHEMIN !
COPY --from=builder /app/packages/server/dist ./dist

# 5. Vérification approfondie
RUN echo "=== VÉRIFICATION ===" && \
    pwd && \
    ls -la && \
    ls -la dist/ && \
    test -f dist/main.js || (echo "❌ dist/main.js manquant!" && exit 1) && \
    echo "✅ dist/main.js trouvé!"

# 6. Créer les dossiers nécessaires
RUN mkdir -p /app/uploads

# 7. Gestion utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app

# 8. Passer à l'utilisateur non-root
USER nestjs

EXPOSE 3000

# 9. Healthcheck (adaptez le chemin /health si nécessaire)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 10. Commande de démarrage - CHEMIN CORRECT pour le contexte /app
CMD ["node", "dist/main.js"]