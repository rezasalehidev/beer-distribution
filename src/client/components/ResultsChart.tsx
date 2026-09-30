import React, { useState } from 'react';
import { FinalResults, Role, ROLES } from '../types';

interface ResultsChartProps {
  finalResults: FinalResults;
}

type MetricType = 'orders' | 'inventory' | 'backlog';

const ROLE_COLORS: Record<Role, string> = {
  retailer: '#fbbf24', // Amber
  wholesaler: '#60a5fa', // Blue
  distributor: '#34d399', // Emerald
  factory: '#a78bfa', // Purple
};

const ROLE_LABELS: Record<Role, string> = {
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  distributor: 'Distributor',
  factory: 'Factory',
};

export const ResultsChart: React.FC<ResultsChartProps> = ({ finalResults }) => {
  const [metric, setMetric] = useState<MetricType>('orders');
  const [activeRoles, setActiveRoles] = useState<Record<Role, boolean>>({
    retailer: true,
    wholesaler: true,
    distributor: true,
    factory: true,
  });

  const toggleRole = (r: Role) => {
    setActiveRoles((prev) => ({ ...prev, [r]: !prev[r] }));
  };

  const rounds = Array.from({ length: 20 }, (_, i) => i + 1);

  // Extract metric series for each role
  const series: Record<Role, number[]> = {
    retailer: [],
    wholesaler: [],
    distributor: [],
    factory: [],
  };

  for (const role of ROLES) {
    const history = finalResults.roles[role]?.history || [];
    series[role] = history.map((record) => {
      if (metric === 'orders') return record.orderPlaced;
      if (metric === 'inventory') return record.inventory;
      return record.backlog;
    });
  }

  // Calculate SVG dimensions and scale
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const allValues = ROLES.filter((r) => activeRoles[r])
    .flatMap((r) => series[r])
    .concat([metric === 'orders' ? 8 : 12]);

  const maxVal = Math.max(...allValues, 10);
  const minVal = 0;

  const getX = (roundIndex: number) => {
    return padding.left + (roundIndex / 19) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    return height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
  };

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Supply Chain Dynamics & Bullwhip Effect Chart
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Compare decisions and inventory levels across the 4 stages of the supply chain.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setMetric('orders')}
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: metric === 'orders' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              borderColor: metric === 'orders' ? 'var(--accent-amber)' : 'transparent',
              color: metric === 'orders' ? '#fbbf24' : 'var(--text-secondary)',
            }}
          >
            Orders Placed
          </button>
          <button
            onClick={() => setMetric('inventory')}
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: metric === 'inventory' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              borderColor: metric === 'inventory' ? 'var(--accent-emerald)' : 'transparent',
              color: metric === 'inventory' ? '#34d399' : 'var(--text-secondary)',
            }}
          >
            Inventory Level
          </button>
          <button
            onClick={() => setMetric('backlog')}
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: metric === 'backlog' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              borderColor: metric === 'backlog' ? 'var(--accent-rose)' : 'transparent',
              color: metric === 'backlog' ? '#fb7185' : 'var(--text-secondary)',
            }}
          >
            Unfilled Backlog
          </button>
        </div>
      </div>

      {/* Role Legend Toggles */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => toggleRole(role)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: activeRoles[role] ? 'var(--bg-secondary)' : 'rgba(31, 41, 61, 0.3)',
              border: `1px solid ${activeRoles[role] ? ROLE_COLORS[role] : 'var(--border-color)'}`,
              color: activeRoles[role] ? 'var(--text-primary)' : 'var(--text-muted)',
              opacity: activeRoles[role] ? 1 : 0.5,
            }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: ROLE_COLORS[role] }} />
            <span>{ROLE_LABELS[role]}</span>
          </button>
        ))}
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(minVal + ratio * (maxVal - minVal));
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X axis labels (Rounds) */}
          {rounds.map((r, i) => {
            const x = getX(i);
            return (
              <g key={r}>
                <text
                  x={x}
                  y={height - 15}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {r}
                </text>
              </g>
            );
          })}

          {/* Trend Lines for each role */}
          {ROLES.map((role) => {
            if (!activeRoles[role]) return null;
            const data = series[role];
            if (data.length === 0) return null;

            const pathData = data
              .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
              .join(' ');

            return (
              <g key={role}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={ROLE_COLORS[role]}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((val, idx) => (
                  <circle
                    key={idx}
                    cx={getX(idx)}
                    cy={getY(val)}
                    r="3.5"
                    fill={ROLE_COLORS[role]}
                    stroke="var(--bg-card)"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
