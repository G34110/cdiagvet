-- Extensions PostgreSQL pour CRM Diagnostics Vétérinaires

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full text search (French)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Trigram pour recherche fuzzy
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
