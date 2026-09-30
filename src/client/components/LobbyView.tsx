import React, { useState } from 'react';
import { Bot, Check, Copy, ExternalLink, Factory, Play, Plus, Store, Truck, UserPlus, Users, Warehouse } from 'lucide-react';
import { PlayerView, Role, ROLES } from '../types';

interface LobbyViewProps {
  gameState: PlayerView | null;
  onJoinGame: (roomCode: string, playerName: string, preferredRole?: Role) => void;
  onCreateGame: (playerName: string) => void;
  onFillBots: () => void;
  onSelectRole: (role: Role) => void;
}

const ROLE_INFO: Record<Role, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  retailer: {
    label: 'Retailer',
    desc: 'Directly serves consumer demand. Ships to end customers, orders from Wholesaler.',
    icon: <Store size={28} color="#fbbf24" />,
    color: '#fbbf24',
  },
  wholesaler: {
    label: 'Wholesaler',
    desc: 'Supplies Retailer. Buffers regional inventory and orders from Distributor.',
    icon: <Warehouse size={28} color="#60a5fa" />,
    color: '#60a5fa',
  },
  distributor: {
    label: 'Distributor',
    desc: 'Connects Factory with Wholesalers across larger geographic networks.',
    icon: <Truck size={28} color="#34d399" />,
    color: '#34d399',
  },
  factory: {
    label: 'Factory',
    desc: 'Brews and packages beer. Backed by an unlimited supplier.',
    icon: <Factory size={28} color="#a78bfa" />,
    color: '#a78bfa',
  },
};

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  onJoinGame,
  onCreateGame,
  onFillBots,
  onSelectRole,
}) => {
  const [playerName, setPlayerName] = useState<string>(() => sessionStorage.getItem('beer_game_player_name') || 'Player');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlayerName(val);
    sessionStorage.setItem('beer_game_player_name', val);
  };

  const handleCopyLink = () => {
    if (gameState?.gameId) {
      const url = `${window.location.origin}?game=${gameState.gameId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenTab = (role: Role) => {
    if (gameState?.gameId) {
      window.open(`/?game=${gameState.gameId}&role=${role}`, '_blank');
    }
  };

  const handleOpenAllTabs = () => {
    if (gameState?.gameId) {
      ROLES.forEach((r) => {
        window.open(`/?game=${gameState.gameId}&role=${r}`, '_blank');
      });
    }
  };

  // If not currently in a room
  if (!gameState) {
    return (
      <div style={{ maxWidth: '650px', margin: '3rem auto' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Supply Chain Simulator
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Multiplayer Beer Distribution Game with authoritative server synchronization.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Your Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              placeholder="Enter your name"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={() => onCreateGame(playerName)}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              <Plus size={18} />
              <span>Create New Game Room</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OR JOIN EXISTING</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Enter 4-letter room code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => onJoinGame(inputCode, playerName)}
                disabled={!inputCode.trim()}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                <UserPlus size={18} />
                <span>Join</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inside a room lobby
  const slotsOccupiedCount = ROLES.filter((r) => gameState.slots[r].occupied).length;

  return (
    <div style={{ maxWidth: '960px', margin: '1rem auto' }}>
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Room Code:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                {gameState.gameId}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Share this code or link with friends to fill all 4 roles, or fill remaining slots with AI Bots.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleCopyLink} className="btn-secondary">
              {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>

            {slotsOccupiedCount < 4 && (
              <button onClick={onFillBots} className="btn-primary">
                <Bot size={18} />
                <span>Fill Empty Slots with AI Bots</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Selection Grid */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={20} color="#60a5fa" />
        <span>Supply Chain Roles ({slotsOccupiedCount} / 4 Players Ready)</span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {ROLES.map((role) => {
          const info = ROLE_INFO[role];
          const slot = gameState.slots[role];
          const isMyRole = gameState.myRole === role;

          return (
            <div
              key={role}
              className="glass-card"
              style={{
                borderColor: isMyRole ? 'var(--accent-amber)' : slot.occupied ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.4)',
                background: isMyRole ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  {info.icon}
                  {slot.occupied ? (
                    <span className={`badge ${slot.isBot ? 'badge-blue' : 'badge-emerald'}`}>
                      {slot.isBot ? 'AI Bot' : 'Occupied'}
                    </span>
                  ) : (
                    <span className="badge badge-amber">Open</span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: info.color, marginBottom: '0.4rem' }}>
                  {info.label}
                </h4>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '48px' }}>
                  {info.desc}
                </p>
              </div>

              <div>
                {slot.occupied ? (
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{slot.playerName}</span>
                    {isMyRole && <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>You</span>}
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectRole(role)}
                    className="btn-primary"
                    style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem' }}
                  >
                    <Play size={14} />
                    <span>Take Role</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Tab Testing Helper Box */}
      <div className="evaluator-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c7d2fe' }}>
              Multi-Tab Evaluation Helper
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Open roles in separate browser tabs to test multiplayer locally with isolated sessions.
            </p>
          </div>
          <button onClick={handleOpenAllTabs} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <ExternalLink size={14} />
            <span>Open All 4 Roles in Tabs</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => handleOpenTab(r)}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
            >
              Open {ROLE_INFO[r].label} <ExternalLink size={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
