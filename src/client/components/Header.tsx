import React, { useState } from 'react';
import { Beer, Check, Copy, LogOut, Radio } from 'lucide-react';
import { PlayerView } from '../types';

interface HeaderProps {
  gameState: PlayerView | null;
  isConnected: boolean;
  onExit: () => void;
}

export const Header: React.FC<HeaderProps> = ({ gameState, isConnected, onExit }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (gameState?.gameId) {
      navigator.clipboard.writeText(gameState.gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roleLabels: Record<string, string> = {
    retailer: 'Retailer',
    wholesaler: 'Wholesaler',
    distributor: 'Distributor',
    factory: 'Factory',
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand-logo">
          <div className="brand-icon">
            <Beer size={20} color="#0b0f19" />
          </div>
          <span>Beer Distribution Game</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {gameState && (
            <>
              {/* Room Code Badge */}
              <button
                onClick={handleCopyCode}
                className="badge badge-amber"
                title="Click to copy room code"
                style={{ cursor: 'pointer' }}
              >
                Room: <strong style={{ letterSpacing: '0.08em' }}>{gameState.gameId}</strong>
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>

              {/* Status / Round Badge */}
              {gameState.status === 'active' && (
                <span className="badge badge-blue">
                  Round {gameState.currentRound} / {gameState.totalRounds}
                </span>
              )}

              {/* Role Badge */}
              {gameState.myRole && (
                <span className="badge badge-purple">
                  Role: {roleLabels[gameState.myRole] || gameState.myRole}
                </span>
              )}
            </>
          )}

          {/* Connection Indicator */}
          <div
            className={`badge ${isConnected ? 'badge-emerald' : 'badge-rose'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {isConnected ? <span className="pulse-dot" /> : <Radio size={12} />}
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          {gameState && (
            <button
              onClick={onExit}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              title="Leave Room"
            >
              <LogOut size={14} />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
