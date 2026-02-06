import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface PeriodFilterValue {
  preset?: string;
  startDate?: string;
  endDate?: string;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

const PRESETS = [
  { value: 'M', label: 'Ce mois' },
  { value: 'M-1', label: 'Mois précédent' },
  { value: 'Q-1', label: 'Trimestre précédent' },
  { value: 'Y-1', label: 'Année précédente' },
  { value: 'custom', label: 'Personnalisé' },
];

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setShowCustom(true);
      onChange({ preset: 'custom', startDate: value.startDate, endDate: value.endDate });
    } else {
      setShowCustom(false);
      onChange({ preset });
    }
    setIsOpen(false);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', dateValue: string) => {
    onChange({
      ...value,
      preset: 'custom',
      [field]: dateValue,
    });
  };

  const currentPreset = PRESETS.find(p => p.value === value.preset) || PRESETS[0];

  return (
    <div className="period-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            background: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <Calendar size={16} />
          {currentPreset.label}
          <ChevronDown size={16} />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.25rem',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              minWidth: '180px',
            }}
          >
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetChange(preset.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: value.preset === preset.value ? 'var(--primary-light)' : 'transparent',
                  color: value.preset === preset.value ? 'var(--primary)' : 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showCustom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={value.startDate || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>→</span>
          <input
            type="date"
            value={value.endDate || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}
          />
        </div>
      )}
    </div>
  );
}
