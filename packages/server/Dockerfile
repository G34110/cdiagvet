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
# Stage 3: Production - VERSION DEBUG
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

LABEL maintainer="Gille"
LABEL description="CDiagVet API Server - NestJS + GraphQL + Prisma"

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# 1. Copier le package.json
COPY packages/server/package.json ./

# 2. Installer les dépendances
RUN npm install --omit=dev

# 3. Copier Prisma et générer
COPY packages/server/prisma ./prisma
RUN npx prisma generate

# 4. Copier le build et DEBUG INTENSIF
COPY --from=builder /app/packages/server/dist ./dist

# 5. VÉRIFICATION DÉTAILLÉE
RUN echo "=== VÉRIFICATION COMPLÈTE DU BUILD ===" && \
    echo "1. Contenu de /app:" && \
    ls -la /app && \
    echo "\n2. Contenu de /app/dist (si existe):" && \
    (ls -la /app/dist 2>/dev/null || echo "❌ /app/dist n'existe pas!") && \
    echo "\n3. Recherche de tous les fichiers main.js:" && \
    find /app -name "main.js" 2>/dev/null || echo "Aucun main.js trouvé!" && \
    echo "\n4. Vérification du dossier builder:" && \
    echo "Contenu de /app/packages/server/dist dans builder (simulé):" && \
    echo "Le build a-t-il bien fonctionné?"

# 6. Créer les dossiers nécessaires
RUN mkdir -p /app/uploads

# 7. Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

# 8. Commande de démarrage avec vérification runtime
CMD ["sh", "-c", "echo '=== RUNTIME DEBUG ===' && pwd && ls -la && ls -la dist/ && node dist/main.js"]