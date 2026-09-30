import {
  advanceRoundWithOrders,
  areAllOrdersSubmitted,
  calculateBotOrder,
  createInitialGameState,
  GameState,
  Role,
  ROLES,
  startGame,
  validateOrder,
} from '../core';
import { db, GameDatabase } from './db';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private database: GameDatabase;

  constructor(database: GameDatabase = db) {
    this.database = database;
  }

  public createGame(customId?: string): GameState {
    const id = customId ? customId.toUpperCase() : generateRoomCode();
    const gameState = createInitialGameState(id);
    this.games.set(id, gameState);
    this.database.saveGame(gameState);
    return gameState;
  }

  public getGame(id: string): GameState | null {
    const upperId = id.toUpperCase();
    let game = this.games.get(upperId);
    if (!game) {
      game = this.database.getGame(upperId) || undefined;
      if (game) {
        this.games.set(upperId, game);
      }
    }
    return game || null;
  }

  public joinGame(
    gameId: string,
    sessionToken: string,
    playerName: string = 'Player',
    preferredRole?: Role
  ): { success: boolean; role?: Role; error?: string; state?: GameState } {
    const upperId = gameId.toUpperCase();
    const game = this.getGame(upperId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // 1. Check if this session already has a role in this game (reconnection)
    for (const role of ROLES) {
      const slot = game.slots[role];
      if (slot.sessionToken === sessionToken) {
        slot.connected = true;
        if (playerName && playerName !== 'Player') {
          slot.playerName = playerName;
        }
        game.updatedAt = Date.now();
        this.database.saveGame(game);
        this.database.saveSession(sessionToken, upperId, role, slot.playerName);
        return { success: true, role, state: game };
      }
    }

    // If game has already started and player isn't in it, joining is locked
    if (game.status !== 'lobby') {
      return { success: false, error: 'Game has already started. Cannot join as a new player.' };
    }

    // 2. Assign to preferred role or next available role
    let assignedRole: Role | null = null;
    if (preferredRole && !game.slots[preferredRole].occupied) {
      assignedRole = preferredRole;
    } else {
      for (const role of ROLES) {
        if (!game.slots[role].occupied) {
          assignedRole = role;
          break;
        }
      }
    }

    if (!assignedRole) {
      return { success: false, error: 'Game lobby is full' };
    }

    // Assign slot
    game.slots[assignedRole] = {
      role: assignedRole,
      occupied: true,
      playerName: playerName || `Player (${assignedRole})`,
      isBot: false,
      sessionToken,
      connected: true,
    };

    game.updatedAt = Date.now();
    this.database.saveSession(sessionToken, upperId, assignedRole, game.slots[assignedRole].playerName);

    // 3. If all slots are now occupied, auto-start game
    const allOccupied = ROLES.every((r) => game.slots[r].occupied);
    if (allOccupied && game.status === 'lobby') {
      const startedState = startGame(game);
      this.games.set(upperId, startedState);
      this.triggerBotOrders(startedState);
      this.database.saveGame(startedState);
      return { success: true, role: assignedRole, state: startedState };
    }

    this.database.saveGame(game);
    return { success: true, role: assignedRole, state: game };
  }

  public fillWithBots(gameId: string): { success: boolean; state?: GameState; error?: string } {
    const upperId = gameId.toUpperCase();
    const game = this.getGame(upperId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'lobby') {
      return { success: false, error: 'Cannot add bots once game has started' };
    }

    for (const role of ROLES) {
      if (!game.slots[role].occupied) {
        game.slots[role] = {
          role,
          occupied: true,
          playerName: `AI Bot (${role.charAt(0).toUpperCase() + role.slice(1)})`,
          isBot: true,
          connected: true,
        };
      }
    }

    const startedState = startGame(game);
    this.games.set(upperId, startedState);
    this.triggerBotOrders(startedState);
    this.database.saveGame(startedState);

    return { success: true, state: startedState };
  }

  public submitOrder(
    gameId: string,
    role: Role,
    amount: number
  ): { success: boolean; error?: string; state?: GameState; advanced?: boolean } {
    const upperId = gameId.toUpperCase();
    const game = this.getGame(upperId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'active') {
      return { success: false, error: `Cannot submit order when game is ${game.status}` };
    }

    // Validate order format
    const valResult = validateOrder(amount);
    if (!valResult.valid || valResult.value === undefined) {
      return { success: false, error: valResult.error || 'Invalid order quantity' };
    }

    // Check if duplicate submission
    if (typeof game.pendingOrders[role] === 'number') {
      return { success: false, error: `Role ${role} has already placed an order for round ${game.currentRound}` };
    }

    // Record player order
    game.pendingOrders[role] = valResult.value;
    game.updatedAt = Date.now();

    // Ensure all bot orders for this round are submitted
    this.triggerBotOrders(game);

    let advanced = false;
    // Advance round if all 4 roles have submitted
    if (areAllOrdersSubmitted(game.pendingOrders)) {
      const orders = {
        retailer: game.pendingOrders.retailer!,
        wholesaler: game.pendingOrders.wholesaler!,
        distributor: game.pendingOrders.distributor!,
        factory: game.pendingOrders.factory!,
      };

      const advancedState = advanceRoundWithOrders(game, orders);
      this.games.set(upperId, advancedState);
      advanced = true;

      // If new round is active, compute bot orders for next round
      if (advancedState.status === 'active') {
        this.triggerBotOrders(advancedState);
      }

      this.database.saveGame(advancedState);
      return { success: true, state: advancedState, advanced: true };
    }

    this.database.saveGame(game);
    return { success: true, state: game, advanced: false };
  }

  public setConnectionStatus(gameId: string, role: Role, connected: boolean): void {
    const game = this.getGame(gameId);
    if (game && game.slots[role]) {
      game.slots[role].connected = connected;
      game.updatedAt = Date.now();
      this.database.saveGame(game);
    }
  }

  private triggerBotOrders(state: GameState): void {
    if (state.status !== 'active') return;

    for (const role of ROLES) {
      const slot = state.slots[role];
      if (slot.isBot && typeof state.pendingOrders[role] !== 'number') {
        const botOrder = calculateBotOrder(role, state.roles[role], state.currentRound);
        state.pendingOrders[role] = botOrder;
      }
    }
  }
}

export const gameManager = new GameManager();
