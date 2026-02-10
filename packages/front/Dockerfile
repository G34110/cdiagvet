# =============================================================================
# Dockerfile - @cdiagvet/front (React + Vite + PWA)
# Multi-stage build avec nginx pour servir les fichiers statiques
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY packages/front/package.json ./packages/front/

# Installer les dépendances
RUN npm ci --workspace=@cdiagvet/front

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Arguments de build (passés via docker-compose ou CI/CD)
ARG VITE_API_URL=http://localhost:3000/graphql
ARG VITE_APP_ENV=production

# Définir les variables d'environnement pour le build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}

# Copier node_modules depuis deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/front/node_modules ./packages/front/node_modules

# Copier le code source
COPY packages/front ./packages/front
COPY package.json ./

# Build Vite
WORKDIR /app/packages/front
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production (nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Métadonnées
LABEL maintainer="Gille"
LABEL description="CDiagVet Frontend - React SPA with PWA support"

# Supprimer la config nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre config nginx personnalisée
COPY packages/front/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/packages/front/dist /usr/share/nginx/html

# Créer un utilisateur non-root (optionnel pour nginx)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Exposer le port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
