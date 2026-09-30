import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientMessage, PlayerView, Role, ServerMessage } from '../types';

function getOrCreateSessionToken(): string {
  const STORAGE_KEY = 'beer_game_session_token';
  let token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export function useGameSocket(gameId: string | null, preferredRole?: Role | null) {
  const [gameState, setGameState] = useState<PlayerView | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string>(getOrCreateSessionToken());
  const intentionalCloseRef = useRef(false);

  const connect = useCallback(() => {
    if (!gameId) return;

    intentionalCloseRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
      intentionalCloseRef.current = false;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev Vite proxy redirects /ws to port 3001
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setErrorMessage(null);

      // Send join lobby intent
      const joinMsg: ClientMessage = {
        type: 'JOIN_LOBBY',
        payload: {
          gameId: gameId.toUpperCase(),
          sessionToken: sessionTokenRef.current,
          playerName: sessionStorage.getItem('beer_game_player_name') || 'Player',
          preferredRole: preferredRole || undefined,
        },
      };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        if (msg.type === 'STATE_UPDATE') {
          setGameState(msg.payload);
        } else if (msg.type === 'ERROR') {
          setErrorMessage(msg.payload.message);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (intentionalCloseRef.current) {
        return;
      }
      // Auto reconnect after 2 seconds on unexpected disconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection error', err);
    };
  }, [gameId, preferredRole]);

  useEffect(() => {
    if (!gameId) {
      setGameState(null);
      setIsConnected(false);
      return;
    }

    connect();
    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, gameId]);

  const submitOrder = useCallback((amount: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setErrorMessage('Not connected to server');
      return;
    }
    const msg: ClientMessage = {
      type: 'SUBMIT_ORDER',
      payload: { amount },
    };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const fillBots = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const msg: ClientMessage = {
      type: 'FILL_BOTS',
    };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  const selectRole = useCallback((role: Role) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const msg: ClientMessage = {
      type: 'SELECT_ROLE',
      payload: { role },
    };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  return {
    gameState,
    isConnected,
    errorMessage,
    clearError: () => setErrorMessage(null),
    submitOrder,
    fillBots,
    selectRole,
    sessionToken: sessionTokenRef.current,
  };
}
