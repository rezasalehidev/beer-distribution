import { Router } from 'express';
import { createPlayerView, Role } from '../core';
import { gameManager } from './game-manager';
import { db } from './db';

export const apiRouter = Router();

// Create a new game room
apiRouter.post('/games', (req, res) => {
  const { customId } = req.body || {};
  const game = gameManager.createGame(customId);
  res.status(201).json({
    success: true,
    gameId: game.id,
    state: createPlayerView(game, null),
  });
});

// Get game state / player view
apiRouter.get('/games/:id', (req, res) => {
  const gameId = req.params.id;
  const sessionToken = req.query.sessionToken as string | undefined;

  const game = gameManager.getGame(gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  let role: Role | null = null;
  if (sessionToken) {
    const session = db.getSession(sessionToken);
    if (session && session.gameId.toUpperCase() === gameId.toUpperCase()) {
      role = session.role;
    }
  }

  const view = createPlayerView(game, role);
  res.json({ success: true, view });
});

// Join a game
apiRouter.post('/games/:id/join', (req, res) => {
  const gameId = req.params.id;
  const { sessionToken, playerName, role } = req.body || {};

  if (!sessionToken) {
    res.status(400).json({ error: 'sessionToken is required' });
    return;
  }

  const result = gameManager.joinGame(gameId, sessionToken, playerName, role);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const view = createPlayerView(result.state!, result.role || null);
  res.json({ success: true, role: result.role, view });
});

// Fill remaining slots with AI Bots
apiRouter.post('/games/:id/bots', (req, res) => {
  const gameId = req.params.id;
  const result = gameManager.fillWithBots(gameId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, state: result.state });
});

// Submit order via HTTP endpoint
apiRouter.post('/games/:id/order', (req, res) => {
  const gameId = req.params.id;
  const { role, amount } = req.body || {};

  if (!role || typeof amount !== 'number') {
    res.status(400).json({ error: 'role and amount are required' });
    return;
  }

  const result = gameManager.submitOrder(gameId, role, amount);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const view = createPlayerView(result.state!, role);
  res.json({ success: true, advanced: result.advanced, view });
});

// List recent games
apiRouter.get('/games', (_req, res) => {
  const games = db.listRecentGames(15);
  res.json({ success: true, games });
});
