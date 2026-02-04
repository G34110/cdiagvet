# CDiagVet - CRM Diagnostics Vétérinaires

CRM pour la gestion commerciale et traçabilité GS1.128 dans le secteur des diagnostics vétérinaires.

## Stack Technique

- **Backend**: NestJS 10, GraphQL (Apollo), Prisma ORM
- **Frontend**: React 18, Vite, Recoil, Emotion
- **Database**: PostgreSQL 15, Redis 7
- **Infrastructure**: Docker Compose, PgBouncer

## Prérequis

- Node.js 20+
- Docker & Docker Compose
- npm 10+

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone <repo-url>
cd cdiagvet
npm install
```

### 2. Configuration

```bash
cp .env.example .env
# Éditer .env si nécessaire
```

### 3. Démarrer les services Docker

```bash
npm run docker:up
```

### 4. Initialiser la base de données

```bash
cd packages/server
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Lancer le développement

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:front
```

## URLs

- **Frontend**: http://localhost:5173
- **GraphQL Playground**: http://localhost:3000/graphql
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Structure du projet

```
cdiagvet/
├── packages/
│   ├── server/          # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   └── clients/
│   │   │   └── common/
│   │   └── prisma/
│   └── front/           # Frontend React
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── state/
│           └── lib/
├── docker/
└── docker-compose.yml
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run docker:up` | Démarrer PostgreSQL, Redis, PgBouncer |
| `npm run docker:down` | Arrêter les containers |
| `npm run dev:server` | Lancer le backend en mode dev |
| `npm run dev:front` | Lancer le frontend en mode dev |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:studio` | Ouvrir Prisma Studio |

## Licence

UNLICENSED - Propriétaire
