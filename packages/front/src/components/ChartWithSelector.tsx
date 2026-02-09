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
  /** Disable pie chart option (for daily data where pie is not relevant) */
  hidePieChart?: boolean;
  /** Secondary data key for stacked bars (e.g., cancelled revenue) */
  secondaryDataKey?: string;
  /** Label for secondary data in tooltip */
  secondaryLabel?: string;
  /** Color for secondary data (default: red) */
  secondaryColor?: string;
  /** Use stacked bars (only for periods > 1 month) */
  stacked?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const VALIDATED_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16']; // Blue, Green, Yellow, Purple, Cyan, Lime
const CANCELLED_COLOR = '#ef4444'; // Single red for all cancelled

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
  hidePieChart = false,
  secondaryDataKey,
  secondaryLabel = 'Annulé',
  secondaryColor = '#ef4444',
  stacked = false,
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

  // Force switch away from pie chart when it's hidden
  useEffect(() => {
    if (hidePieChart && chartType === 'pie') {
      setChartType('bar');
    }
  }, [hidePieChart, chartType]);

  const formatTooltip = (value: number) => {
    if (tooltipFormatter) {
      return [tooltipFormatter(value), tooltipLabel];
    }
    return [value.toLocaleString('fr-FR'), tooltipLabel];
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line': {
        // Calculate percentages for legend
        const lineTotalValidated = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
        const lineTotalCancelled = secondaryDataKey ? data.reduce((sum, item) => sum + (Number(item[secondaryDataKey]) || 0), 0) : 0;
        const lineTotal = lineTotalValidated + lineTotalCancelled;
        const lineValidatedPercent = lineTotal > 0 ? ((lineTotalValidated / lineTotal) * 100).toFixed(0) : '0';
        const lineCancelledPercent = lineTotal > 0 ? ((lineTotalCancelled / lineTotal) * 100).toFixed(0) : '0';

        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} interval={0} tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const label = name === dataKey ? tooltipLabel : secondaryLabel;
                if (tooltipFormatter) {
                  return [tooltipFormatter(value), label];
                }
                return [value.toLocaleString('fr-FR'), label];
              }} 
            />
            {secondaryDataKey && (
              <Legend 
                formatter={(value) => {
                  if (value === dataKey) return `${tooltipLabel} (${lineValidatedPercent}%)`;
                  return `${secondaryLabel} (${lineCancelledPercent}%)`;
                }} 
              />
            )}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name={dataKey}
            />
            {secondaryDataKey && (
              <Line 
                type="monotone" 
                dataKey={secondaryDataKey} 
                stroke={secondaryColor} 
                strokeWidth={2}
                dot={{ fill: secondaryColor, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name={secondaryDataKey}
              />
            )}
          </LineChart>
        );
      }

      case 'pie':
        // For pie chart with secondary data, show both validated (blue shades) and cancelled (red shades) per period
        if (secondaryDataKey) {
          const pieData: { name: string; value: number; type: 'validated' | 'cancelled'; monthIndex: number; label: string }[] = [];
          
          let validatedIdx = 0;
          let cancelledIdx = 0;
          
          data.forEach(item => {
            const validatedValue = Number(item[dataKey]) || 0;
            const cancelledValue = Number(item[secondaryDataKey]) || 0;
            const label = String(item[nameKey]);
            
            if (validatedValue > 0) {
              pieData.push({ name: `${label} (${tooltipLabel})`, value: validatedValue, type: 'validated', monthIndex: validatedIdx++, label });
            }
            if (cancelledValue > 0) {
              pieData.push({ name: `${label} (${secondaryLabel})`, value: cancelledValue, type: 'cancelled', monthIndex: cancelledIdx++, label });
            }
          });
          
          if (pieData.length === 0) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                Aucune donnée sur cette période
              </div>
            );
          }

          // Calculate totals for percentages
          const pieTotalValidated = pieData.filter(d => d.type === 'validated').reduce((sum, d) => sum + d.value, 0);
          const pieTotalCancelled = pieData.filter(d => d.type === 'cancelled').reduce((sum, d) => sum + d.value, 0);
          const pieGrandTotal = pieTotalValidated + pieTotalCancelled;
          const pieValidatedPercent = pieGrandTotal > 0 ? ((pieTotalValidated / pieGrandTotal) * 100).toFixed(0) : '0';
          const pieCancelledPercent = pieGrandTotal > 0 ? ((pieTotalCancelled / pieGrandTotal) * 100).toFixed(0) : '0';

          // Simplified legend data - just Validé and Annulé with percentages
          const legendData = [
            { value: `${tooltipLabel} (${pieValidatedPercent}%)`, color: VALIDATED_COLORS[0] },
            { value: `${secondaryLabel} (${pieCancelledPercent}%)`, color: CANCELLED_COLOR },
          ];
          
          return (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, label, percent }) => {
                  // Always show label for cancelled (name contains secondaryLabel), or if percent > 3%
                  const isCancelled = name && name.includes(secondaryLabel);
                  if (isCancelled || percent > 0.03) {
                    return `${label} (${(percent * 100).toFixed(0)}%)`;
                  }
                  return '';
                }}
                outerRadius={80}
                fill={color}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry) => (
                  <Cell 
                    key={`cell-${entry.name}`} 
                    fill={entry.type === 'cancelled' 
                      ? CANCELLED_COLOR 
                      : VALIDATED_COLORS[entry.monthIndex % VALIDATED_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatTooltip(value)} />
              <Legend 
                payload={legendData.map(item => ({
                  value: item.value,
                  type: 'square',
                  color: item.color,
                }))}
              />
            </PieChart>
          );
        }
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
        if (stacked && secondaryDataKey) {
          // Calculate percentages for stacked bar legend
          const stackedTotalValidated = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
          const stackedTotalCancelled = data.reduce((sum, item) => sum + (Number(item[secondaryDataKey]) || 0), 0);
          const stackedTotal = stackedTotalValidated + stackedTotalCancelled;
          const stackedValidatedPercent = stackedTotal > 0 ? ((stackedTotalValidated / stackedTotal) * 100).toFixed(0) : '0';
          const stackedCancelledPercent = stackedTotal > 0 ? ((stackedTotalCancelled / stackedTotal) * 100).toFixed(0) : '0';

          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const label = name === dataKey ? tooltipLabel : secondaryLabel;
                  if (tooltipFormatter) {
                    return [tooltipFormatter(value), label];
                  }
                  return [value.toLocaleString('fr-FR'), label];
                }} 
              />
              <Legend 
                formatter={(value) => {
                  if (value === dataKey) return `${tooltipLabel} (${stackedValidatedPercent}%)`;
                  return `${secondaryLabel} (${stackedCancelledPercent}%)`;
                }}
              />
              <Bar dataKey={dataKey} stackId="a" fill={color} name={dataKey} />
              <Bar dataKey={secondaryDataKey} stackId="a" fill={secondaryColor} name={secondaryDataKey} radius={[4, 4, 0, 0]} />
            </BarChart>
          );
        }
        // Calculate percentages for legend (non-stacked bar chart for daily data)
        const totalValidated = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
        const totalCancelled = secondaryDataKey ? data.reduce((sum, item) => sum + (Number(item[secondaryDataKey]) || 0), 0) : 0;
        const total = totalValidated + totalCancelled;
        const validatedPercent = total > 0 ? ((totalValidated / total) * 100).toFixed(0) : '0';
        const cancelledPercent = total > 0 ? ((totalCancelled / total) * 100).toFixed(0) : '0';

        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} interval={0} tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(value: number) => formatTooltip(value)} />
            {secondaryDataKey && (
              <Legend 
                formatter={(value) => {
                  if (value === dataKey) return `${tooltipLabel} (${validatedPercent}%)`;
                  return `${secondaryLabel} (${cancelledPercent}%)`;
                }}
              />
            )}
            <Bar dataKey={dataKey} fill={color} radius={secondaryDataKey ? [0, 0, 0, 0] : [4, 4, 0, 0]} name={dataKey} />
            {secondaryDataKey && (
              <Bar dataKey={secondaryDataKey} fill={secondaryColor} radius={[4, 4, 0, 0]} name={secondaryDataKey} />
            )}
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
          {!hidePieChart && (
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
          )}
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
