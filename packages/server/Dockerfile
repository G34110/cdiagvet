# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

LABEL maintainer="Gille"
LABEL description="CDiagVet API Server - NestJS + GraphQL + Prisma"

ENV NODE_ENV=production
ENV PORT=3000

# Créer et se positionner dans le dossier server
WORKDIR /app/packages/server

# Copier package.json dans le bon contexte
COPY packages/server/package.json ./

# Installer les dépendances de production
RUN npm install --omit=dev

# Copier les fichiers Prisma
COPY packages/server/prisma ./prisma

# Générer le client Prisma
RUN npx prisma generate

# Copier le build
COPY --from=builder /app/packages/server/dist ./dist

# Vérification
RUN ls -la ./dist/ && test -f ./dist/main.js || (echo "❌ main.js non trouvé!" && exit 1)

# Créer l'utilisateur non-root (en remontant à /app pour les permissions)
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    mkdir -p /app/uploads && \
    chown -R nestjs:nodejs /app /app/packages/server/uploads 2>/dev/null || true

USER nestjs
WORKDIR /app/packages/server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]