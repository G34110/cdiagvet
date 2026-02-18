import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Plan, isMenuAllowed } from '../config/planFeatures';

interface PlanContextType {
  currentPlan: Plan;
  setPlan: (plan: Plan) => void;
  isMenuVisible: (menuId: string) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const STORAGE_KEY = 'cdiagvet_demo_plan';

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [currentPlan, setCurrentPlan] = useState<Plan>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Plan) || 'L';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentPlan);
  }, [currentPlan]);

  const setPlan = (plan: Plan) => {
    setCurrentPlan(plan);
  };

  const isMenuVisible = (menuId: string): boolean => {
    return isMenuAllowed(menuId, currentPlan);
  };

  return (
    <PlanContext.Provider value={{ currentPlan, setPlan, isMenuVisible }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
