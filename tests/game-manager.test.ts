import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GameDatabase } from '../src/server/db';
import { GameManager } from '../src/server/game-manager';

const TEST_DB_PATH = path.resolve(__dirname, 'test_beer_game.db');

describe('GameManager & SQLite Persistence Integration', () => {
  let db: GameDatabase;
  let gm: GameManager;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    db = new GameDatabase(TEST_DB_PATH);
    gm = new GameManager(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('should handle complete game lifecycle with 4 players, order progression, and DB persistence', () => {
    const game = gm.createGame('ROOM1');
    expect(game.id).toBe('ROOM1');
    expect(game.status).toBe('lobby');

    // 4 players join
    const p1 = gm.joinGame('ROOM1', 'token-ret', 'Alice', 'retailer');
    expect(p1.success).toBe(true);
    expect(p1.role).toBe('retailer');
    expect(p1.state?.status).toBe('lobby');

    const p2 = gm.joinGame('ROOM1', 'token-whl', 'Bob', 'wholesaler');
    expect(p2.success).toBe(true);

    const p3 = gm.joinGame('ROOM1', 'token-dst', 'Charlie', 'distributor');
    expect(p3.success).toBe(true);

    const p4 = gm.joinGame('ROOM1', 'token-fac', 'Dave', 'factory');
    expect(p4.success).toBe(true);
    // All 4 slots occupied -> auto starts
    expect(p4.state?.status).toBe('active');
    expect(p4.state?.currentRound).toBe(1);

    // Test order submissions
    const retOrder = gm.submitOrder('ROOM1', 'retailer', 4, 'token-ret');
    expect(retOrder.success).toBe(true);
    expect(retOrder.advanced).toBe(false);

    // Duplicate submission in same round should fail
    const dupOrder = gm.submitOrder('ROOM1', 'retailer', 6, 'token-ret');
    expect(dupOrder.success).toBe(false);
    expect(dupOrder.error).toContain('already placed an order');

    // Unauthorized order spoofing should fail
    const spoof = gm.submitOrder('ROOM1', 'wholesaler', 4, 'wrong-token');
    expect(spoof.success).toBe(false);
    expect(spoof.error).toContain('Unauthorized');

    // Submit remaining orders
    gm.submitOrder('ROOM1', 'wholesaler', 4, 'token-whl');
    gm.submitOrder('ROOM1', 'distributor', 4, 'token-dst');
    const finalOrder = gm.submitOrder('ROOM1', 'factory', 4, 'token-fac');

    expect(finalOrder.success).toBe(true);
    expect(finalOrder.advanced).toBe(true);
    expect(finalOrder.state?.currentRound).toBe(2);

    // Test server restart / DB reload: create a new GameManager instance on same DB
    const newGm = new GameManager(db);
    const reloadedGame = newGm.getGame('ROOM1');
    expect(reloadedGame).toBeDefined();
    expect(reloadedGame?.currentRound).toBe(2);
    expect(reloadedGame?.status).toBe('active');
    expect(reloadedGame?.history.retailer.length).toBe(1);
    expect(reloadedGame?.history.retailer[0].orderPlaced).toBe(4);

    // Reconnecting player with existing token
    const reconnect = newGm.joinGame('ROOM1', 'token-ret', 'Alice');
    expect(reconnect.success).toBe(true);
    expect(reconnect.role).toBe('retailer');
  });

  it('should auto-fill empty slots with AI bots and advance rounds automatically when human player orders', () => {
    gm.createGame('BOTRM');
    gm.joinGame('BOTRM', 'token-solo', 'Solo Player', 'retailer');

    const botFill = gm.fillWithBots('BOTRM');
    expect(botFill.success).toBe(true);
    expect(botFill.state?.status).toBe('active');
    expect(botFill.state?.currentRound).toBe(1);
    expect(botFill.state?.slots.wholesaler.isBot).toBe(true);
    expect(botFill.state?.slots.distributor.isBot).toBe(true);
    expect(botFill.state?.slots.factory.isBot).toBe(true);

    // Since bots auto-order, the sole human player submitting an order should advance the round immediately
    const humanOrder = gm.submitOrder('BOTRM', 'retailer', 4, 'token-solo');
    expect(humanOrder.success).toBe(true);
    expect(humanOrder.advanced).toBe(true);
    expect(humanOrder.state?.currentRound).toBe(2);
  });

  it('should allow lobby role switching for an existing session', () => {
    gm.createGame('SWITCH');
    const first = gm.joinGame('SWITCH', 'token-a', 'Alex', 'retailer');
    expect(first.role).toBe('retailer');

    const switched = gm.selectRole('SWITCH', 'token-a', 'factory', 'Alex');
    expect(switched.success).toBe(true);
    expect(switched.role).toBe('factory');
    expect(switched.state?.slots.retailer.occupied).toBe(false);
    expect(switched.state?.slots.factory.occupied).toBe(true);
    expect(switched.state?.slots.factory.sessionToken).toBe('token-a');
  });
});
