import React from 'react';
import { AlertCircle, ArrowDownLeft, Boxes, DollarSign, PackageCheck, TrendingUp } from 'lucide-react';
import { RoleState } from '../types';

interface RoundMetricsCardProps {
  myState: RoleState;
}

export const RoundMetricsCard: React.FC<RoundMetricsCardProps> = ({ myState }) => {
  return (
    <div className="metrics-grid">
      {/* Inventory */}
      <div className="metric-card emerald">
        <div className="metric-title">
          <Boxes size={16} color="#34d399" />
          <span>Current Inventory</span>
        </div>
        <div className="metric-value">{myState.inventory}</div>
        <div className="metric-subtext">Holding Cost: $0.50 / unit</div>
      </div>

      {/* Backlog */}
      <div className="metric-card rose">
        <div className="metric-title">
          <AlertCircle size={16} color="#fb7185" />
          <span>Unfilled Backlog</span>
        </div>
        <div className="metric-value">{myState.backlog}</div>
        <div className="metric-subtext">Penalty Cost: $1.00 / unit</div>
      </div>

      {/* Shipment Arrived */}
      <div className="metric-card amber">
        <div className="metric-title">
          <ArrowDownLeft size={16} color="#fbbf24" />
          <span>Shipment Arrived</span>
        </div>
        <div className="metric-value">{myState.shipmentArrived}</div>
        <div className="metric-subtext">Next round in transit: {myState.shipmentsInTransit[0]}</div>
      </div>

      {/* Incoming Order */}
      <div className="metric-card">
        <div className="metric-title">
          <PackageCheck size={16} color="#60a5fa" />
          <span>Incoming Order</span>
        </div>
        <div className="metric-value">{myState.incomingOrder}</div>
        <div className="metric-subtext">Shipped to downstream: {myState.shipped}</div>
      </div>

      {/* Round Cost */}
      <div className="metric-card purple">
        <div className="metric-title">
          <DollarSign size={16} color="#a78bfa" />
          <span>Round Cost</span>
        </div>
        <div className="metric-value">${myState.roundCost.toFixed(1)}</div>
        <div className="metric-subtext">
          0.5 × {myState.inventory} + 1.0 × {myState.backlog}
        </div>
      </div>

      {/* Cumulative Cost */}
      <div className="metric-card">
        <div className="metric-title">
          <TrendingUp size={16} color="#38bdf8" />
          <span>Total Cost So Far</span>
        </div>
        <div className="metric-value" style={{ color: '#38bdf8' }}>
          ${myState.totalCost.toFixed(1)}
        </div>
        <div className="metric-subtext">Cumulative game cost</div>
      </div>
    </div>
  );
};
