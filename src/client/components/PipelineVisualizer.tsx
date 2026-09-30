import React from 'react';
import { ArrowLeft, ArrowRight, Bot, Factory, Store, Truck, User, Warehouse } from 'lucide-react';
import { PlayerView, Role, ROLES } from '../types';

interface PipelineVisualizerProps {
  gameState: PlayerView;
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  retailer: <Store size={20} color="#fbbf24" />,
  wholesaler: <Warehouse size={20} color="#60a5fa" />,
  distributor: <Truck size={20} color="#34d399" />,
  factory: <Factory size={20} color="#a78bfa" />,
};

const ROLE_NAMES: Record<Role, string> = {
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  distributor: 'Distributor',
  factory: 'Factory',
};

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ gameState }) => {
  const currentRole = gameState.myRole;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>Orders flow right</span> <ArrowRight size={12} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <ArrowLeft size={12} /> <span>Shipments flow left</span>
        </div>
      </div>

      <div className="pipeline-container">
        {/* Customer Node */}
        <div className="pipeline-node" style={{ opacity: 0.85 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CONSUMER</div>
          <div style={{ fontWeight: 700, margin: '0.2rem 0' }}>Customer</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
            Demand: {gameState.currentRound <= 4 ? '4 / rd' : '8 / rd'}
          </div>
        </div>

        <div className="pipeline-arrow"><ArrowRight size={16} /></div>

        {/* 4 Roles in Supply Chain */}
        {ROLES.map((role, idx) => {
          const slot = gameState.slots[role];
          const isCurrent = currentRole === role;
          const isSubmitted = gameState.roundSubmissions[role];

          return (
            <React.Fragment key={role}>
              <div
                className={`pipeline-node ${isCurrent ? 'active-role' : ''}`}
                style={{
                  borderWidth: isCurrent ? '2px' : '1px',
                  position: 'relative',
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '8px',
                      background: 'var(--accent-amber)',
                      color: '#0b0f19',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    YOU
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  {ROLE_ICONS[role]}
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ROLE_NAMES[role]}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {slot.isBot ? <Bot size={12} /> : <User size={12} />}
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {slot.playerName || (slot.isBot ? 'AI Bot' : 'Waiting...')}
                  </span>
                </div>

                {gameState.status === 'active' && (
                  <div style={{ marginTop: '0.35rem' }}>
                    {isSubmitted ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        Order Ready ✓
                      </span>
                    ) : (
                      <span className="badge badge-gray" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        Ordering...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {idx < ROLES.length - 1 && (
                <div className="pipeline-arrow"><ArrowRight size={16} /></div>
              )}
            </React.Fragment>
          );
        })}

        <div className="pipeline-arrow"><ArrowRight size={16} /></div>

        {/* Unlimited Supplier Node */}
        <div className="pipeline-node" style={{ opacity: 0.85 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SUPPLIER</div>
          <div style={{ fontWeight: 700, margin: '0.2rem 0' }}>Brewery</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>Unlimited Cap</div>
        </div>
      </div>
    </div>
  );
};
