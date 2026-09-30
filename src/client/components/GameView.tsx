import React from 'react';
import { PlayerView } from '../types';
import { PipelineVisualizer } from './PipelineVisualizer';
import { RoundMetricsCard } from './RoundMetricsCard';
import { OrderForm } from './OrderForm';
import { PlayerStatusBoard } from './PlayerStatusBoard';
import { RoundHistoryTable } from './RoundHistoryTable';

interface GameViewProps {
  gameState: PlayerView;
  onSubmitOrder: (amount: number) => void;
}

export const GameView: React.FC<GameViewProps> = ({ gameState, onSubmitOrder }) => {
  const myState = gameState.myState;

  if (!myState) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Connecting to role...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Supply Chain Flow Pipeline */}
      <PipelineVisualizer gameState={gameState} />

      {/* Primary Round Metrics */}
      <RoundMetricsCard myState={myState} />

      {/* Decision Section & Submission Tracker */}
      <div className="order-section">
        <OrderForm
          myState={myState}
          submittedThisRound={gameState.submittedThisRound}
          currentRound={gameState.currentRound}
          onSubmitOrder={onSubmitOrder}
        />
        <PlayerStatusBoard gameState={gameState} />
      </div>

      {/* Historical Ledger for Current Role */}
      <RoundHistoryTable history={gameState.myHistory} />
    </div>
  );
};
