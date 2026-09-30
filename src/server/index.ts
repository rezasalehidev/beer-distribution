import cors from 'cors';
import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import { CONFIG } from './config';
import { apiRouter } from './routes';
import { GameWebSocketServer } from './ws-handler';

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server on /ws path
const wss = new WebSocketServer({ server, path: '/ws' });
export const gameWsServer = new GameWebSocketServer(wss);

// Serve static frontend in production
if (fs.existsSync(CONFIG.CLIENT_DIST_PATH)) {
  app.use(express.static(CONFIG.CLIENT_DIST_PATH));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CONFIG.CLIENT_DIST_PATH, 'index.html'));
  });
}

server.listen(CONFIG.PORT, () => {
  console.log(`🚀 Beer Distribution Game server running on port ${CONFIG.PORT}`);
  console.log(`📊 SQLite database connected at ${CONFIG.DB_PATH}`);
  console.log(`🔌 WebSockets listening on ws://localhost:${CONFIG.PORT}/ws`);
});
