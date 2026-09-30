import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Role } from './types';
import { useGameSocket } from './hooks/useGameSocket';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { ResultsView } from './components/ResultsView';

export const App: React.FC = () => {
  // Read initial query params from URL
  const [activeGameId, setActiveGameId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('game') ? params.get('game')!.toUpperCase() : null;
  });

  const [preferredRole, setPreferredRole] = useState<Role | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam && ['retailer', 'wholesaler', 'distributor', 'factory'].includes(roleParam)) {
      return roleParam as Role;
    }
    return null;
  });

  const {
    gameState,
    isConnected,
    errorMessage,
    clearError,
    submitOrder,
    fillBots,
    selectRole,
  } = useGameSocket(activeGameId, preferredRole);

  // Synchronize URL with activeGameId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeGameId) {
      params.set('game', activeGameId);
      if (gameState?.myRole) {
        params.set('role', gameState.myRole);
      }
    } else {
      params.delete('game');
      params.delete('role');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeGameId, gameState?.myRole]);

  const handleCreateGame = async (playerName: string) => {
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.gameId) {
        sessionStorage.setItem('beer_game_player_name', playerName);
        setActiveGameId(data.gameId);
      }
    } catch (e: any) {
      console.error('Failed to create game', e);
    }
  };

  const handleJoinGame = (roomCode: string, playerName: string, role?: Role) => {
    sessionStorage.setItem('beer_game_player_name', playerName);
    if (role) {
      setPreferredRole(role);
    }
    setActiveGameId(roomCode.trim().toUpperCase());
  };

  const handleSelectRole = async (role: Role) => {
    if (!activeGameId) return;
    setPreferredRole(role);
    selectRole(role);
  };

  const handleExit = () => {
    setActiveGameId(null);
    setPreferredRole(null);
  };

  return (
    <div className="app-container">
      <Header
        gameState={gameState}
        isConnected={isConnected}
        onExit={handleExit}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.9)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={clearError} style={{ color: '#fff' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <main className="main-content">
        {!activeGameId || !gameState || gameState.status === 'lobby' ? (
          <LobbyView
            gameState={gameState}
            onJoinGame={handleJoinGame}
            onCreateGame={handleCreateGame}
            onFillBots={fillBots}
            onSelectRole={handleSelectRole}
          />
        ) : gameState.status === 'active' ? (
          <GameView
            gameState={gameState}
            onSubmitOrder={submitOrder}
          />
        ) : (
          <ResultsView
            finalResults={gameState.finalResults!}
            onPlayAgain={handleExit}
          />
        )}
      </main>
    </div>
  );
};
