import React, { useState } from 'react';
import { Award, DollarSign, Factory, RotateCcw, Store, Table, Truck, Warehouse } from 'lucide-react';
import { FinalResults, Role, ROLES } from '../types';
import { ResultsChart } from './ResultsChart';

interface ResultsViewProps {
  finalResults: FinalResults;
  onPlayAgain: () => void;
}

const ROLE_INFO: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  retailer: { label: 'Retailer', icon: <Store size={22} color="#fbbf24" />, color: '#fbbf24' },
  wholesaler: { label: 'Wholesaler', icon: <Warehouse size={22} color="#60a5fa" />, color: '#60a5fa' },
  distributor: { label: 'Distributor', icon: <Truck size={22} color="#34d399" />, color: '#34d399' },
  factory: { label: 'Factory', icon: <Factory size={22} color="#a78bfa" />, color: '#a78bfa' },
};

export const ResultsView: React.FC<ResultsViewProps> = ({ finalResults, onPlayAgain }) => {
  const [selectedRoleTable, setSelectedRoleTable] = useState<Role>('retailer');

  // Sort roles by total cost ascending
  const sortedRoles = [...ROLES].sort(
    (a, b) => finalResults.roles[a].totalCost - finalResults.roles[b].totalCost
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '1rem auto' }}>
      {/* Game Over Banner */}
      <div
        className="glass-card"
        style={{
          textAlign: 'center',
          padding: '2.5rem',
          background: 'linear-gradient(180deg, rgba(31, 41, 61, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)',
          marginBottom: '2rem',
        }}
      >
        <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
          Simulation Complete • 20 Rounds Finished
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Supply Chain Performance Summary
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          All 20 rounds have been executed. Compare supply chain costs, inventory stability, and order oscillation across roles.
        </p>

        {/* Hero Total Cost */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(11, 15, 25, 0.8)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <DollarSign size={32} color="#f59e0b" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Supply Chain Cost
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
              ${finalResults.totalCost.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Role Breakdown Cards */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award size={20} color="#fbbf24" />
        <span>Role Performance Breakdown</span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {sortedRoles.map((role, rank) => {
          const info = ROLE_INFO[role];
          const summary = finalResults.roles[role];
          const isBest = rank === 0;

          return (
            <div
              key={role}
              className="glass-card"
              style={{
                borderColor: isBest ? 'var(--accent-emerald)' : 'var(--border-color)',
                position: 'relative',
              }}
            >
              {isBest && (
                <span
                  className="badge badge-emerald"
                  style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.7rem' }}
                >
                  Lowest Cost
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                {info.icon}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: info.color }}>
                    {info.label}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Rank #{rank + 1}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    ${summary.totalCost.toFixed(1)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Final Inventory:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{summary.inventory}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Final Backlog:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: summary.backlog > 0 ? '#fb7185' : 'inherit' }}>
                    {summary.backlog}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Chart */}
      <ResultsChart finalResults={finalResults} />

      {/* Full Multi-Role History Table */}
      <div className="table-container">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="#60a5fa" />
            <span>Complete 20-Round Ledger</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRoleTable(r)}
                className="btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderColor: selectedRoleTable === r ? ROLE_INFO[r].color : 'var(--border-color)',
                  color: selectedRoleTable === r ? ROLE_INFO[r].color : 'var(--text-secondary)',
                  background: selectedRoleTable === r ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                }}
              >
                {ROLE_INFO[r].label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Shipment Arrived</th>
                <th>Incoming Order</th>
                <th>Shipped</th>
                <th>Inventory</th>
                <th>Backlog</th>
                <th>Round Cost</th>
                <th>Total Cost</th>
                <th>Order Placed</th>
              </tr>
            </thead>
            <tbody>
              {(finalResults.roles[selectedRoleTable]?.history || []).map((record) => (
                <tr key={record.round}>
                  <td style={{ fontWeight: 700 }}>Round {record.round}</td>
                  <td style={{ color: '#fbbf24' }}>+{record.shipmentArrived}</td>
                  <td style={{ color: '#60a5fa' }}>{record.incomingOrder}</td>
                  <td>{record.shipped}</td>
                  <td style={{ color: record.inventory > 0 ? '#34d399' : 'inherit' }}>{record.inventory}</td>
                  <td style={{ color: record.backlog > 0 ? '#fb7185' : 'inherit', fontWeight: record.backlog > 0 ? 700 : 400 }}>
                    {record.backlog}
                  </td>
                  <td>${record.roundCost.toFixed(1)}</td>
                  <td style={{ fontWeight: 600 }}>${record.totalCost.toFixed(1)}</td>
                  <td style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{record.orderPlaced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '2rem' }}>
        <button onClick={onPlayAgain} className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
          <RotateCcw size={18} />
          <span>Play Another Game</span>
        </button>
      </div>
    </div>
  );
};
