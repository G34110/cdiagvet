# Guide de Déploiement CDiagVet

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   OVH Domain    │────▶│   Cloudflare     │     │    Railway      │
│  (DNS Config)   │     │   (Frontend)     │────▶│   (Backend)     │
└─────────────────┘     └──────────────────┘     │   PostgreSQL    │
                                                  └─────────────────┘
```

---

## 1. Déploiement Backend (Railway)

### 1.1 Créer le projet Railway

1. Aller sur [railway.app](https://railway.app)
2. **New Project** > **Deploy from GitHub repo**
3. Sélectionner le repo `cdiagvet`
4. Configurer le **Root Directory** : `packages/server`

### 1.2 Ajouter PostgreSQL

1. Dans le projet Railway : **+ New** > **Database** > **PostgreSQL**
2. Railway crée automatiquement `DATABASE_URL`

### 1.3 Variables d'environnement

Dans Railway > **Variables**, ajouter :

```env
PORT=3000
NODE_ENV=demo
APP_ENV=demo
FRONTEND_URL=https://cdiagvet.cvbusiness.fr
CORS_ORIGIN=https://cdiagvet.cvbusiness.fr
JWT_SECRET=<générer avec: openssl rand -base64 64>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
SMTP_FROM=CDiagVet <gillescaruso@cvbusiness.fr>
```

### 1.4 Déployer

Railway déploie automatiquement à chaque push sur `main`.

URL générée : `https://cdiagvet-demo.up.railway.app`

---

## 2. Déploiement Frontend (Cloudflare Pages)

### 2.1 Connecter le repo

1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com) > **Pages**
2. **Create a project** > **Connect to Git**
3. Sélectionner le repo `cdiagvet`

### 2.2 Configuration du build

| Paramètre | Valeur |
|-----------|--------|
| **Framework preset** | None |
| **Build command** | `cd packages/front && npm install && npm run build` |
| **Build output directory** | `packages/front/dist` |
| **Root directory** | `/` |

### 2.3 Variables d'environnement

Dans Cloudflare Pages > **Settings** > **Environment variables** :

| Variable | demo |
|----------|------------|
| `VITE_API_URL` | `https://cdiagvet-demo.up.railway.app/graphql` |
| `VITE_APP_ENV` | `demo` |

### 2.4 Déployer

Cloudflare déploie automatiquement à chaque push.

---

## 3. Configuration DNS (OVH → Cloudflare)

### 3.1 Ajouter le domaine dans Cloudflare

1. Cloudflare Dashboard > **Add a Site**
2. Entrer votre domaine OVH
3. Cloudflare affiche les **Nameservers** à configurer

### 3.2 Configurer OVH

1. OVH Manager > **Domaines** > votre domaine
2. **Serveurs DNS** > **Modifier les serveurs DNS**
3. Remplacer par les nameservers Cloudflare :
   - `xxx.ns.cloudflare.com`
   - `yyy.ns.cloudflare.com`

### 3.3 Configurer les enregistrements DNS

Dans Cloudflare > **DNS** :

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `cdiagvet` | `cdiagvet.pages.dev` | ✅ |
| CNAME | `api` | `cdiagvet-demo.up.railway.app` | ❌ DNS only |

### 3.4 Configurer le domaine personnalisé

**Cloudflare Pages** :
1. Pages > votre projet > **Custom domains**
2. Ajouter `cdiagvet.cvbusiness.fr`

**Railway** (optionnel) :
1. Railway > votre service > **Settings** > **Domains**
2. Ajouter `api-cdiagvet.cvbusiness.fr`

---

## 4. Checklist Post-Déploiement

- [ ] Backend accessible : `https://api-cdiagvet.cvbusiness.fr/health`
- [ ] Frontend accessible : `https://cdiagvet.cvbusiness.fr`
- [ ] GraphQL Playground : `https://api-cdiagvet.cvbusiness.fr/graphql`
- [ ] Login fonctionne
- [ ] CORS configuré correctement
- [ ] HTTPS actif partout
- [ ] Emails envoyés (tester reset password)

---

## 5. Seed de la base de données (première fois)

Après le premier déploiement, exécuter le seed :

```bash
# Dans Railway > Service > Shell
npx prisma db seed
```

Ou via Railway CLI :
```bash
railway run npx prisma db seed
```

---

## 6. Rollback

### Railway
1. **Deployments** > Sélectionner un déploiement précédent > **Redeploy**

### Cloudflare Pages
1. **Deployments** > Sélectionner un build précédent > **Rollback to this deployment**

---

## 7. Monitoring

- **Railway** : Logs en temps réel dans le dashboard
- **Cloudflare** : Analytics dans Pages > Analytics
- **Healthcheck** : `GET /health` retourne `{ status: 'ok' }`
