# Configuration Multi-Environnements CDiagVet

## Vue d'ensemble

| Environnement | Usage | BDD | Redis | URL |
|---------------|-------|-----|-------|-----|
| **DEV** | Développement local | localhost:5432 | localhost:6379 | localhost:5173 |
| **DEMO** | Démonstrations clients, tests UAT | demo-db.cdiagvet.fr | demo-redis | demo.cdiagvet.fr |
| **PROD** | Production | prod-db.cdiagvet.fr | prod-redis | app.cdiagvet.fr |

## Architecture recommandée

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │    DEV      │     │    DEMO     │     │    PROD     │                   │
│   ├─────────────┤     ├─────────────┤     ├─────────────┤                   │
│   │ PostgreSQL  │     │ PostgreSQL  │     │ PostgreSQL  │                   │
│   │ (local)     │     │ (managed)   │     │ (managed)   │                   │
│   │             │     │             │     │ + réplica   │                   │
│   ├─────────────┤     ├─────────────┤     ├─────────────┤                   │
│   │ PgBouncer   │     │ PgBouncer   │     │ PgBouncer   │                   │
│   │ (local)     │     │ (container) │     │ (container) │                   │
│   ├─────────────┤     ├─────────────┤     ├─────────────┤                   │
│   │ Redis       │     │ Redis       │     │ Redis       │                   │
│   │ (local)     │     │ (managed)   │     │ (managed)   │                   │
│   └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fichiers de configuration

```
cdiagvet/
├── .env                    # Environnement actif (copie de .env.dev/.env.demo/.env.prod)
├── .env.dev                # Configuration DEV
├── .env.demo               # Configuration DEMO
├── .env.prod               # Configuration PROD
├── docker-compose.yml      # DEV local
├── docker-compose.demo.yml # DEMO
└── docker-compose.prod.yml # PROD
```

## Isolation des données

### Pourquoi des BDD séparées ?

1. **Sécurité** : Les données PROD ne doivent jamais être accessibles depuis DEV/DEMO
2. **Performance** : Les tests de charge en DEMO n'impactent pas PROD
3. **Conformité** : RGPD impose une séparation des données personnelles
4. **Rollback** : Chaque environnement a ses propres backups

### Stratégie de données

| Environnement | Données |
|---------------|---------|
| DEV | Données de seed fictives (faker) |
| DEMO | Copie anonymisée de PROD ou données de démonstration réalistes |
| PROD | Données réelles clients |

## Commandes utiles

```bash
# Charger l'environnement DEV
cp .env.dev .env

# Charger l'environnement DEMO
cp .env.demo .env

# Charger l'environnement PROD (attention!)
cp .env.prod .env

# Démarrer avec un environnement spécifique
docker compose -f docker-compose.demo.yml up -d
```

## Variables différenciées par environnement

| Variable | DEV | DEMO | PROD |
|----------|-----|------|------|
| NODE_ENV | development | staging | production |
| DATABASE_URL | localhost | demo-db | prod-db |
| JWT_EXPIRES_IN | 7d | 14d | 14d |
| LOG_LEVEL | debug | info | warn |
| RATE_LIMIT | désactivé | 100/min | 60/min |
