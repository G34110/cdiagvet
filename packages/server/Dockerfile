# =============================================================================
# Dockerfile - Version simplifiée et robuste
# =============================================================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copier tous les fichiers nécessaires
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/server ./packages/server

# Installer toutes les dépendances
RUN npm ci

# Générer Prisma client
WORKDIR /app/packages/server
RUN npx prisma generate

# Build NestJS - forçons la sortie dans /app/dist
RUN npm run build && \
    mkdir -p /app/dist && \
    cp -r dist/* /app/dist/ 2>/dev/null || true && \
    echo "Build terminé. Contenu de /app/packages/server/dist:" && \
    ls -la /app/packages/server/dist

# Stage 2: Production
FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copier le build depuis le builder - en prenant tout
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/packages/server/node_modules/@prisma/client ./node_modules/@prisma/client

# Installer les dépendances de production
RUN npm install --omit=dev && \
    npx prisma generate

# Vérification finale
RUN echo "=== VÉRIFICATION FINALE ===" && \
    ls -la && \
    ls -la dist/ && \
    test -f dist/main.js || (echo "❌ TOUJOURS PAS DE MAIN.JS!" && exit 1)

# Créer l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    mkdir -p /app/uploads && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Démarrer l'application
CMD ["node", "dist/main.js"]