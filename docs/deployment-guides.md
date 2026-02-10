# 🚀 Guides de Déploiement CDiagVet

> Ce document détaille les étapes de déploiement pour les 3 options d'hébergement avec Cloudflare comme CDN/proxy.

---

## Table des matières

1. [Prérequis communs](#1-prérequis-communs)
2. [Option A : Railway + Cloudflare](#2-option-a--railway--cloudflare)
3. [Option B : Scaleway + Cloudflare](#3-option-b--scaleway--cloudflare)
4. [Option C : OVH VPS + Cloudflare](#4-option-c--ovh-vps--cloudflare)
5. [Configuration Cloudflare (commune)](#5-configuration-cloudflare-commune)

---

## 1. Prérequis communs

### 1.1 Comptes à créer

| Service | URL | Gratuit |
|---------|-----|---------|
| GitHub | github.com | ✅ |
| Cloudflare | cloudflare.com | ✅ (plan Free) |
| Railway / Scaleway / OVH | Selon option | Variable |

### 1.2 Domaine

- Acheter un domaine (ex: `cdiagvet.fr`) sur OVH, Gandi, ou Cloudflare Registrar
- Configurer les DNS sur Cloudflare (voir section 5)

### 1.3 Fichiers déjà créés

✅ `packages/server/Dockerfile`
✅ `packages/front/Dockerfile`
✅ `docker-compose.prod.yml`
✅ `.env.production.example`
✅ `packages/server/src/modules/health/*`

---

## 2. Option A : Railway + Cloudflare

**Coût estimé :** ~$20/mois | **Temps setup :** ~2h | **Difficulté :** ⭐ Facile

### Étape 1 : Créer un compte Railway

1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Créer un nouveau projet : **"New Project"** → **"Empty Project"**

### Étape 2 : Créer les services

#### 2.1 PostgreSQL
```
1. Dans le projet → "New" → "Database" → "PostgreSQL"
2. Cliquer sur le service créé → "Variables"
3. Noter : DATABASE_URL (sera utilisé plus tard)
```

#### 2.2 Redis
```
1. "New" → "Database" → "Redis"
2. Noter : REDIS_URL
```

#### 2.3 Backend (NestJS)
```
1. "New" → "GitHub Repo" → Sélectionner votre repo cdiagvet
2. Railway détecte automatiquement le Dockerfile
3. Settings → "Root Directory" : packages/server
4. Settings → "Dockerfile Path" : Dockerfile
```

#### 2.4 Frontend (React)
```
1. "New" → "GitHub Repo" → Même repo
2. Settings → "Root Directory" : packages/front
3. Settings → "Dockerfile Path" : Dockerfile
```

### Étape 3 : Configurer les variables d'environnement

#### Backend (`cdiagvet-server`)
Aller dans **Variables** et ajouter :

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<générer avec: openssl rand -base64 64>
JWT_EXPIRES_IN=14d
CORS_ORIGIN=https://app.cdiagvet.fr
```

#### Frontend (`cdiagvet-front`)
```env
VITE_API_URL=https://api.cdiagvet.fr/graphql
VITE_APP_ENV=production
```

### Étape 4 : Configurer les domaines

#### Backend
```
1. Service backend → Settings → Networking → "Generate Domain"
2. Ou "Custom Domain" : api.cdiagvet.fr
```

#### Frontend
```
1. Service frontend → Settings → Networking
2. "Custom Domain" : app.cdiagvet.fr
```

### Étape 5 : Exécuter les migrations Prisma

```bash
# Dans Railway, ouvrir le shell du service backend
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### Étape 6 : Vérifier le déploiement

```bash
# Test health
curl https://api.cdiagvet.fr/health

# Test GraphQL
curl https://api.cdiagvet.fr/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### 📊 Architecture finale Railway

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE                                  │
│  app.cdiagvet.fr → Railway Frontend                            │
│  api.cdiagvet.fr → Railway Backend                             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                     ┌───────────────────┐
│   Frontend        │                     │   Backend         │
│   (nginx:80)      │                     │   (node:3000)     │
└───────────────────┘                     └─────────┬─────────┘
                                                    │
                              ┌─────────────────────┴─────────────┐
                              ▼                                   ▼
                    ┌───────────────────┐               ┌───────────────────┐
                    │   PostgreSQL      │               │   Redis           │
                    └───────────────────┘               └───────────────────┘
```

---

## 3. Option B : Scaleway + Cloudflare

**Coût estimé :** ~€40/mois | **Temps setup :** ~4h | **Difficulté :** ⭐⭐ Moyen

### Étape 1 : Créer un compte Scaleway

1. Aller sur [console.scaleway.com](https://console.scaleway.com)
2. Créer un compte et valider l'identité
3. Créer un projet : **"CDiagVet Production"**

### Étape 2 : Créer les services managés

#### 2.1 PostgreSQL (Managed Database)
```
1. Console → Managed Databases → Create Database
2. Type : PostgreSQL 15
3. Plan : DB-DEV-S (€8.76/mois) - suffisant pour démo
4. Région : Paris (fr-par)
5. Nom : cdiagvet-db
6. Noter les credentials après création
```

#### 2.2 Redis (Managed Cache - optionnel, sinon Serverless)
```
1. Console → Managed Databases → Create Database
2. Type : Redis 7
3. Plan : RED-1-S (~€10/mois)
4. Ou utiliser le cache intégré dans le container
```

#### 2.3 Container Registry
```
1. Console → Container Registry → Create Namespace
2. Nom : cdiagvet
3. Région : Paris
4. Privacy : Private
```

### Étape 3 : Pousser les images Docker

```bash
# 1. Se connecter au registry Scaleway
docker login rg.fr-par.scw.cloud/cdiagvet -u nologin --password-stdin <<< "$SCW_SECRET_KEY"

# 2. Builder et taguer les images
docker build -t rg.fr-par.scw.cloud/cdiagvet/server:latest -f packages/server/Dockerfile .
docker build -t rg.fr-par.scw.cloud/cdiagvet/front:latest -f packages/front/Dockerfile .

# 3. Pousser
docker push rg.fr-par.scw.cloud/cdiagvet/server:latest
docker push rg.fr-par.scw.cloud/cdiagvet/front:latest
```

### Étape 4 : Créer les Serverless Containers

#### 4.1 Backend Container
```
1. Console → Serverless → Containers → Create Container
2. Namespace : cdiagvet
3. Image : rg.fr-par.scw.cloud/cdiagvet/server:latest
4. Port : 3000
5. Ressources : 1 vCPU, 1GB RAM
6. Min instances : 1 (pour éviter cold start)
7. Max instances : 3
```

Variables d'environnement :
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
REDIS_URL=redis://:password@host:6379
JWT_SECRET=<votre_secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://app.cdiagvet.fr
```

#### 4.2 Frontend Container
```
1. Create Container
2. Image : rg.fr-par.scw.cloud/cdiagvet/front:latest
3. Port : 80
4. Ressources : 0.5 vCPU, 512MB RAM
5. Min instances : 0 (cold start OK pour frontend)
```

### Étape 5 : Configurer les endpoints

```
1. Chaque container a une URL générée : xxx.functions.fnc.fr-par.scw.cloud
2. Configurer les Custom Domains dans Cloudflare (voir section 5)
```

### Étape 6 : Exécuter les migrations

```bash
# Depuis votre machine locale (avec DATABASE_URL de Scaleway)
export DATABASE_URL="postgresql://..."
cd packages/server
npx prisma migrate deploy
npx prisma db seed
```

### 📊 Architecture finale Scaleway

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE                                  │
│  app.cdiagvet.fr → Scaleway Frontend Container                 │
│  api.cdiagvet.fr → Scaleway Backend Container                  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────┐                     ┌───────────────────┐
│ Serverless        │                     │ Serverless        │
│ Container (Front) │                     │ Container (Back)  │
│ fr-par            │                     │ fr-par            │
└───────────────────┘                     └─────────┬─────────┘
                                                    │
                              ┌─────────────────────┴─────────────┐
                              ▼                                   ▼
                    ┌───────────────────┐               ┌───────────────────┐
                    │ Managed PostgreSQL│               │ Managed Redis     │
                    │ (backup auto)     │               │ (optionnel)       │
                    └───────────────────┘               └───────────────────┘
```

---

## 4. Option C : OVH VPS + Cloudflare

**Coût estimé :** ~€20/mois | **Temps setup :** ~6h | **Difficulté :** ⭐⭐⭐ Avancé

### Étape 1 : Commander un VPS OVH

1. Aller sur [ovhcloud.com](https://www.ovhcloud.com/fr/vps/)
2. Choisir **VPS Starter** ou **VPS Essential** :
   - Starter : 2 vCPU, 2GB RAM, 40GB SSD (~€6/mois)
   - Essential : 2 vCPU, 4GB RAM, 80GB SSD (~€12/mois) ✅ Recommandé
3. OS : **Ubuntu 22.04 LTS**
4. Région : **Gravelines (gra)** ou **Roubaix (rbx)**
5. Commander et attendre l'email avec les credentials

### Étape 2 : Configurer le VPS

```bash
# 1. Se connecter en SSH
ssh root@<IP_VPS>

# 2. Mettre à jour le système
apt update && apt upgrade -y

# 3. Créer un utilisateur non-root
adduser cdiagvet
usermod -aG sudo cdiagvet

# 4. Configurer SSH (désactiver root login)
nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no (après avoir configuré les clés SSH)
systemctl restart sshd

# 5. Configurer le firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Étape 3 : Installer Docker

```bash
# En tant que cdiagvet
sudo -i

# Installer Docker
curl -fsSL https://get.docker.com | sh

# Installer Docker Compose v2
apt install docker-compose-plugin -y

# Ajouter l'utilisateur au groupe docker
usermod -aG docker cdiagvet

# Vérifier
docker --version
docker compose version
```

### Étape 4 : Cloner et configurer le projet

```bash
# En tant que cdiagvet
su - cdiagvet

# Créer le dossier
mkdir -p /home/cdiagvet/apps
cd /home/cdiagvet/apps

# Cloner le repo (ou copier via SCP)
git clone https://github.com/votre-user/cdiagvet.git
cd cdiagvet

# Créer le fichier .env.production
cp .env.production.example .env.production
nano .env.production
```

Contenu de `.env.production` :
```env
# Database
POSTGRES_USER=cdiagvet
POSTGRES_PASSWORD=<mot_de_passe_fort>
POSTGRES_DB=cdiagvet

# Redis
REDIS_PASSWORD=<mot_de_passe_redis>

# JWT
JWT_SECRET=<générer avec: openssl rand -base64 64>
JWT_EXPIRES_IN=7d

# URLs
VITE_API_URL=https://api.cdiagvet.fr/graphql

# Ports
HTTP_PORT=80
HTTPS_PORT=443
```

### Étape 5 : Configurer le reverse proxy nginx

Créer le fichier de configuration pour SSL :

```bash
mkdir -p docker/nginx/ssl
nano docker/nginx/nginx.conf
```

Modifier la configuration nginx pour activer HTTPS (voir fichier existant).

### Étape 6 : Installer Certbot pour SSL

```bash
# Installer Certbot
sudo apt install certbot -y

# Obtenir les certificats (avant de lancer docker)
sudo certbot certonly --standalone -d api.cdiagvet.fr -d app.cdiagvet.fr

# Copier les certificats
sudo cp /etc/letsencrypt/live/api.cdiagvet.fr/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.cdiagvet.fr/privkey.pem docker/nginx/ssl/
sudo chown cdiagvet:cdiagvet docker/nginx/ssl/*
```

### Étape 7 : Lancer l'application

```bash
# Builder les images
docker compose -f docker-compose.prod.yml build

# Lancer en arrière-plan
docker compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker compose -f docker-compose.prod.yml logs -f

# Exécuter les migrations
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec server npx prisma db seed
```

### Étape 8 : Configurer le renouvellement automatique SSL

```bash
# Créer un script de renouvellement
sudo nano /etc/cron.d/certbot-renew

# Contenu :
0 3 * * * root certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/api.cdiagvet.fr/*.pem /home/cdiagvet/apps/cdiagvet/docker/nginx/ssl/ && docker compose -f /home/cdiagvet/apps/cdiagvet/docker-compose.prod.yml restart nginx"
```

### Étape 9 : Configurer les sauvegardes automatiques

```bash
# Créer le script de backup
nano /home/cdiagvet/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR=/home/cdiagvet/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
docker compose -f /home/cdiagvet/apps/cdiagvet/docker-compose.prod.yml exec -T postgres pg_dump -U cdiagvet cdiagvet | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

```bash
# Rendre exécutable et planifier
chmod +x /home/cdiagvet/scripts/backup.sh
crontab -e
# Ajouter : 0 2 * * * /home/cdiagvet/scripts/backup.sh
```

### 📊 Architecture finale OVH

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE                                  │
│  app.cdiagvet.fr ─┐                                            │
│  api.cdiagvet.fr ─┴──────────────────────────────────────────► │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS (port 443)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OVH VPS (France)                            │
│                     IP: xxx.xxx.xxx.xxx                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ nginx (reverse proxy)                                    │   │
│  │   /            → frontend:80                            │   │
│  │   /graphql     → server:3000                            │   │
│  │   /health      → server:3000                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┴────────────────────┐            │
│         ▼                                         ▼            │
│  ┌─────────────┐                           ┌─────────────┐     │
│  │  Frontend   │                           │   Backend   │     │
│  │  (React)    │                           │  (NestJS)   │     │
│  └─────────────┘                           └──────┬──────┘     │
│                                                   │            │
│                              ┌────────────────────┴──────┐     │
│                              ▼                           ▼     │
│                       ┌───────────┐              ┌───────────┐ │
│                       │PostgreSQL │              │   Redis   │ │
│                       │ +PgBouncer│              │           │ │
│                       └───────────┘              └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Configuration Cloudflare (commune)

### Étape 1 : Ajouter le domaine

1. Se connecter sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. **"Add a Site"** → Entrer votre domaine (ex: `cdiagvet.fr`)
3. Choisir le plan **Free**
4. Cloudflare scanne les DNS existants

### Étape 2 : Configurer les DNS

| Type | Nom | Contenu | Proxy |
|------|-----|---------|-------|
| A | `api` | IP du serveur (OVH) ou CNAME Railway/Scaleway | ✅ Proxied |
| A | `app` | IP du serveur (OVH) ou CNAME Railway/Scaleway | ✅ Proxied |
| CNAME | `www` | `app.cdiagvet.fr` | ✅ Proxied |

**Pour Railway :**
```
CNAME api → xxx.up.railway.app
CNAME app → yyy.up.railway.app
```

**Pour Scaleway :**
```
CNAME api → xxx.functions.fnc.fr-par.scw.cloud
CNAME app → yyy.functions.fnc.fr-par.scw.cloud
```

**Pour OVH :**
```
A api → 51.xxx.xxx.xxx (IP du VPS)
A app → 51.xxx.xxx.xxx
```

### Étape 3 : Configurer SSL/TLS

1. **SSL/TLS** → **Overview** → Mode : **Full (strict)**
2. **Edge Certificates** → **Always Use HTTPS** : ✅
3. **Edge Certificates** → **Automatic HTTPS Rewrites** : ✅

### Étape 4 : Configurer les Page Rules (optionnel)

```
# Cache agressif pour les assets statiques
URL : app.cdiagvet.fr/*.js
Setting : Cache Level = Cache Everything, Edge Cache TTL = 1 month

# Bypass cache pour l'API
URL : api.cdiagvet.fr/*
Setting : Cache Level = Bypass
```

### Étape 5 : Configurer la sécurité

1. **Security** → **Settings** → Security Level : **Medium**
2. **Security** → **Bots** → Bot Fight Mode : ✅
3. **Security** → **WAF** → Managed Rules : Activer les règles OWASP

---

## 6. Comparatif final

| Critère | Railway | Scaleway | OVH VPS |
|---------|---------|----------|---------|
| **Coût/mois** | ~$20 | ~€40 | ~€20 |
| **Temps setup** | 2h | 4h | 6h |
| **Difficulté** | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Hébergé FR** | ❌ | ✅ | ✅ |
| **Auto-scaling** | ✅ | ✅ | ❌ |
| **Backups auto** | ✅ | ✅ | Manuel |
| **CI/CD intégré** | ✅ | ❌ | ❌ |
| **Maintenance** | Aucune | Faible | Élevée |

---

## 7. Troubleshooting

### Problème : Container ne démarre pas

```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs server
docker compose -f docker-compose.prod.yml logs front

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml config
```

### Problème : Base de données inaccessible

```bash
# Tester la connexion
docker compose -f docker-compose.prod.yml exec server npx prisma db pull

# Vérifier que PostgreSQL est ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Problème : CORS errors

Vérifier que `CORS_ORIGIN` dans le backend correspond exactement à l'URL du frontend (avec https://).

### Problème : SSL certificate errors

```bash
# Vérifier les certificats
openssl s_client -connect api.cdiagvet.fr:443 -servername api.cdiagvet.fr
```

---

*Document généré le 10/02/2026 - CDiagVet v1.0*
