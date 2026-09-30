import { WebSocket, WebSocketServer } from 'ws';
import { ClientMessage, createPlayerView, Role, ServerMessage } from '../core';
import { gameManager } from './game-manager';

interface ClientSocket extends WebSocket {
  gameId?: string;
  sessionToken?: string;
  role?: Role | null;
  isAlive?: boolean;
}

export class GameWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<ClientSocket> = new Set();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.init();
  }

  private init(): void {
    this.wss.on('connection', (ws: ClientSocket) => {
      this.clients.add(ws);
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw: string) => {
        try {
          const message = JSON.parse(raw.toString()) as ClientMessage;
          this.handleMessage(ws, message);
        } catch (err: any) {
          this.send(ws, {
            type: 'ERROR',
            payload: { message: err.message || 'Invalid message format' },
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        if (ws.gameId && ws.role) {
          gameManager.setConnectionStatus(ws.gameId, ws.role, false);
          this.broadcastGame(ws.gameId);
        }
      });
    });

    // Heartbeat ping interval
    const interval = setInterval(() => {
      for (const ws of this.clients) {
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private handleMessage(ws: ClientSocket, message: ClientMessage): void {
    switch (message.type) {
      case 'PING': {
        this.send(ws, { type: 'PONG' });
        break;
      }

      case 'JOIN_LOBBY': {
        const { gameId, sessionToken, playerName, preferredRole } = message.payload;
        const result = gameManager.joinGame(gameId, sessionToken, playerName, preferredRole);

        if (!result.success) {
          this.send(ws, {
            type: 'ERROR',
            payload: { message: result.error || 'Failed to join game' },
          });
          return;
        }

        ws.gameId = gameId.toUpperCase();
        ws.sessionToken = sessionToken;
        ws.role = result.role || null;

        this.broadcastGame(ws.gameId);
        break;
      }

      case 'FILL_BOTS': {
        if (!ws.gameId) {
          this.send(ws, { type: 'ERROR', payload: { message: 'Not connected to a game' } });
          return;
        }

        const result = gameManager.fillWithBots(ws.gameId);
        if (!result.success) {
          this.send(ws, { type: 'ERROR', payload: { message: result.error || 'Failed to add bots' } });
          return;
        }

        this.broadcastGame(ws.gameId);
        break;
      }

      case 'SELECT_ROLE': {
        if (!ws.gameId || !ws.sessionToken) {
          this.send(ws, { type: 'ERROR', payload: { message: 'Not connected to a game' } });
          return;
        }

        const result = gameManager.selectRole(ws.gameId, ws.sessionToken, message.payload.role);
        if (!result.success) {
          this.send(ws, {
            type: 'ERROR',
            payload: { message: result.error || 'Failed to select role' },
          });
          return;
        }

        ws.role = result.role || null;
        this.broadcastGame(ws.gameId);
        break;
      }

      case 'SUBMIT_ORDER': {
        if (!ws.gameId || !ws.role || !ws.sessionToken) {
          this.send(ws, { type: 'ERROR', payload: { message: 'Not in an active role' } });
          return;
        }

        const { amount } = message.payload;
        const result = gameManager.submitOrder(ws.gameId, ws.role, amount, ws.sessionToken);

        if (!result.success) {
          this.send(ws, { type: 'ERROR', payload: { message: result.error || 'Failed to submit order' } });
          return;
        }

        this.broadcastGame(ws.gameId);
        break;
      }

      default:
        break;
    }
  }

  public broadcastGame(gameId: string): void {
    const upperId = gameId.toUpperCase();
    const game = gameManager.getGame(upperId);
    if (!game) return;

    for (const client of this.clients) {
      if (client.gameId === upperId && client.readyState === WebSocket.OPEN) {
        const view = createPlayerView(game, client.role || null);
        this.send(client, {
          type: 'STATE_UPDATE',
          payload: view,
        });
      }
    }
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
