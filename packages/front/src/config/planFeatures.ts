/**
 * Configuration des fonctionnalités par forfait S/M/L
 * Utilisé pour le masquage des menus selon le plan sélectionné
 */

export type Plan = 'S' | 'M' | 'L';

export interface PlanConfig {
  label: string;
  description: string;
  color: string;
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  S: {
    label: 'Essentiel',
    description: 'Gestion clients basique',
    color: '#10B981', // green
  },
  M: {
    label: 'Business',
    description: 'CRM complet',
    color: '#3B82F6', // blue
  },
  L: {
    label: 'Premium',
    description: 'CRM + Portail client',
    color: '#8B5CF6', // purple
  },
};

/**
 * Menus autorisés par forfait
 * Clé = identifiant du menu utilisé dans la Sidebar
 */
export const PLAN_MENUS: Record<Plan, string[]> = {
  S: [
    'dashboard',
    'clients',
  ],
  M: [
    'dashboard',
    'clients',
    'opportunities',
    'orders',
    'products',
    'visits',
    'users',
  ],
  L: [
    'dashboard',
    'clients',
    'opportunities',
    'orders',
    'products',
    'visits',
    'users',
    'filieres',
    'lots',
  ],
};

/**
 * Vérifie si un menu est accessible pour un plan donné
 */
export function isMenuAllowed(menuId: string, plan: Plan): boolean {
  return PLAN_MENUS[plan].includes(menuId);
}

/**
 * Limites par forfait (pour affichage informatif)
 */
export const PLAN_LIMITS: Record<Plan, { clients: number; users: number; storage: string }> = {
  S: { clients: 500, users: 3, storage: '0 Go' },
  M: { clients: 5000, users: 10, storage: '5 Go' },
  L: { clients: -1, users: -1, storage: '50 Go' }, // -1 = illimité
};

/**
 * Rôles disponibles par forfait
 */
export const PLAN_ROLES: Record<Plan, string[]> = {
  S: ['ADMIN'],
  M: ['ADMIN', 'COMMERCIAL', 'RESPONSABLE_FILIERE'],
  L: ['ADMIN', 'COMMERCIAL', 'RESPONSABLE_FILIERE', 'QUALITE', 'DISTRIBUTEUR'],
};
