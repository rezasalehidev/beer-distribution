import React from 'react';
import { History } from 'lucide-react';
import { RoleRoundRecord } from '../types';

interface RoundHistoryTableProps {
  history: RoleRoundRecord[];
}

export const RoundHistoryTable: React.FC<RoundHistoryTableProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="#f59e0b" />
          <span>Your Round History</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {history.length} round{history.length === 1 ? '' : 's'} completed
        </span>
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
            {history.map((record) => (
              <tr key={record.round}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Round {record.round}
                </td>
                <td style={{ color: '#fbbf24' }}>+{record.shipmentArrived}</td>
                <td style={{ color: '#60a5fa' }}>{record.incomingOrder}</td>
                <td>{record.shipped}</td>
                <td style={{ color: record.inventory > 0 ? '#34d399' : 'inherit' }}>
                  {record.inventory}
                </td>
                <td style={{ color: record.backlog > 0 ? '#fb7185' : 'inherit', fontWeight: record.backlog > 0 ? 700 : 400 }}>
                  {record.backlog}
                </td>
                <td>${record.roundCost.toFixed(1)}</td>
                <td style={{ fontWeight: 600 }}>${record.totalCost.toFixed(1)}</td>
                <td style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                  {record.orderPlaced}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
