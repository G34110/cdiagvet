import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

type ChartType = 'bar' | 'line' | 'pie';

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ChartWithSelectorProps {
  /** Unique identifier for saving preferences */
  chartId: string;
  /** Chart title */
  title: string;
  /** Icon component to display in header */
  icon?: React.ReactNode;
  /** Data array with name and value properties */
  data: ChartData[];
  /** Key in data for the value (default: 'value') */
  dataKey?: string;
  /** Key in data for the label (default: 'name') */
  nameKey?: string;
  /** Primary color for the chart */
  color?: string;
  /** Height of the chart container */
  height?: number;
  /** Format function for tooltip values */
  tooltipFormatter?: (value: number) => string;
  /** Label for the value in tooltip */
  tooltipLabel?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STORAGE_KEY_PREFIX = 'chart_type_';

export default function ChartWithSelector({
  chartId,
  title,
  icon,
  data,
  dataKey = 'value',
  nameKey = 'name',
  color = '#3b82f6',
  height = 250,
  tooltipFormatter,
  tooltipLabel = 'Valeur',
}: ChartWithSelectorProps) {
  // Load saved preference or default to 'bar'
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${chartId}`);
    return (saved as ChartType) || 'bar';
  });

  // Save preference when changed
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${chartId}`, chartType);
  }, [chartId, chartType]);

  const formatTooltip = (value: number) => {
    if (tooltipFormatter) {
      return [tooltipFormatter(value), tooltipLabel];
    }
    return [value.toLocaleString('fr-FR'), tooltipLabel];
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip formatter={(value: number) => formatTooltip(value)} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill={color}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatTooltip(value)} />
            <Legend />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip formatter={(value: number) => formatTooltip(value)} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <section className="dashboard-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          {icon}
          {title}
        </h2>
        <div className="chart-type-selector" style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
            title="Barres"
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              background: chartType === 'bar' ? 'var(--primary)' : 'white',
              color: chartType === 'bar' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setChartType('line')}
            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
            title="Courbe"
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              background: chartType === 'line' ? 'var(--primary)' : 'white',
              color: chartType === 'line' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LineChartIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
            title="Camembert"
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              background: chartType === 'pie' ? 'var(--primary)' : 'white',
              color: chartType === 'pie' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PieChartIcon size={18} />
          </button>
        </div>
      </div>

      {data && data.length > 0 ? (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state">
          {icon}
          <p>Aucune donnée disponible</p>
        </div>
      )}
    </section>
  );
}
