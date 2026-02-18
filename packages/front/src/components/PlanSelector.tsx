import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Package } from 'lucide-react';
import { usePlan } from '../contexts/PlanContext';
import { Plan, PLAN_CONFIG } from '../config/planFeatures';
import './PlanSelector.css';

interface PlanSelectorProps {
  userRole?: string;
}

export default function PlanSelector({ userRole }: PlanSelectorProps) {
  const { currentPlan, setPlan } = usePlan();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Visible uniquement pour les admins
  if (userRole !== 'ADMIN') {
    return null;
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setPlan(plan);
    setIsOpen(false);
  };

  const currentConfig = PLAN_CONFIG[currentPlan];

  return (
    <div className="plan-selector" ref={dropdownRef}>
      <button
        className="plan-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: currentConfig.color }}
      >
        <Package size={16} style={{ color: currentConfig.color }} />
        <span className="plan-label">
          Forfait <strong style={{ color: currentConfig.color }}>{currentPlan}</strong>
        </span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="plan-dropdown">
          <div className="plan-dropdown-header">
            <Package size={14} />
            <span>Mode Démo - Sélection Forfait</span>
          </div>
          {(Object.keys(PLAN_CONFIG) as Plan[]).map((plan) => {
            const config = PLAN_CONFIG[plan];
            const isActive = plan === currentPlan;
            return (
              <button
                key={plan}
                className={`plan-option ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectPlan(plan)}
              >
                <div
                  className="plan-badge"
                  style={{ backgroundColor: config.color }}
                >
                  {plan}
                </div>
                <div className="plan-info">
                  <span className="plan-name">{config.label}</span>
                  <span className="plan-desc">{config.description}</span>
                </div>
                {isActive && <span className="plan-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
