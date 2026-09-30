import Database from 'better-sqlite3';
import { CONFIG } from './config';
import { GameState, Role } from '../core';

export class GameDatabase {
  private db: Database.Database;

  constructor(dbPath: string = CONFIG.DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        current_round INTEGER NOT NULL,
        state_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS player_sessions (
        session_token TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        role TEXT NOT NULL,
        player_name TEXT NOT NULL,
        last_active INTEGER NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_game ON player_sessions(game_id);
    `);
  }

  public saveGame(game: GameState): void {
    const stmt = this.db.prepare(`
      INSERT INTO games (id, status, current_round, state_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        current_round = excluded.current_round,
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      game.id,
      game.status,
      game.currentRound,
      JSON.stringify(game),
      game.createdAt,
      game.updatedAt
    );
  }

  public getGame(id: string): GameState | null {
    const stmt = this.db.prepare('SELECT state_json FROM games WHERE id = ?');
    const row = stmt.get(id) as { state_json: string } | undefined;
    if (!row) {
      return null;
    }
    return JSON.parse(row.state_json) as GameState;
  }

  public listRecentGames(limit: number = 20): Array<{ id: string; status: string; round: number; createdAt: number; updatedAt: number }> {
    const stmt = this.db.prepare(`
      SELECT id, status, current_round as round, created_at as createdAt, updated_at as updatedAt
      FROM games
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as any;
  }

  public saveSession(sessionToken: string, gameId: string, role: Role, playerName: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO player_sessions (session_token, game_id, role, player_name, last_active)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_token) DO UPDATE SET
        game_id = excluded.game_id,
        role = excluded.role,
        player_name = excluded.player_name,
        last_active = excluded.last_active
    `);
    stmt.run(sessionToken, gameId, role, playerName, Date.now());
  }

  public getSession(sessionToken: string): { sessionToken: string; gameId: string; role: Role; playerName: string } | null {
    const stmt = this.db.prepare(`
      SELECT session_token as sessionToken, game_id as gameId, role, player_name as playerName
      FROM player_sessions
      WHERE session_token = ?
    `);
    const row = stmt.get(sessionToken) as any;
    return row || null;
  }

  public close(): void {
    this.db.close();
  }
}

export const db = new GameDatabase();
