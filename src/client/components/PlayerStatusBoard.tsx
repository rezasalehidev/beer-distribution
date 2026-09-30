import React from 'react';
import { CheckCircle, Clock, Users } from 'lucide-react';
import { PlayerView, Role, ROLES } from '../types';

interface PlayerStatusBoardProps {
  gameState: PlayerView;
}

const ROLE_NAMES: Record<Role, string> = {
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  distributor: 'Distributor',
  factory: 'Factory',
};

export const PlayerStatusBoard: React.FC<PlayerStatusBoardProps> = ({ gameState }) => {
  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Users size={18} color="#60a5fa" />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Round {gameState.currentRound} Submission Status</h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {ROLES.map((role) => {
          const slot = gameState.slots[role];
          const isSubmitted = gameState.roundSubmissions[role];
          const isYou = gameState.myRole === role;

          return (
            <div
              key={role}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                background: isYou ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                border: isYou ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {ROLE_NAMES[role]}
                </span>
                {isYou && (
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                    You
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({slot.isBot ? 'AI Bot' : slot.playerName || 'Player'})
                </span>
              </div>

              <div>
                {isSubmitted ? (
                  <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={12} />
                    <span>Submitted</span>
                  </span>
                ) : (
                  <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    <span>Thinking...</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
