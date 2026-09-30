import { describe, expect, it } from 'vitest';
import {
  advanceRoundWithOrders,
  createInitialGameState,
  createPlayerView,
  ROLES,
  startGame,
} from '../src/core';

describe('Player Visibility & Security Redaction', () => {
  it('should only expose a player’s own role state and hide other players’ internal metrics during active rounds', () => {
    let state = createInitialGameState('game-vis-test');
    ROLES.forEach((r) => {
      state.slots[r].occupied = true;
      state.slots[r].playerName = `Player ${r}`;
    });

    state = startGame(state);
    state.pendingOrders.retailer = 4; // retailer placed order

    const retailerRpcView = createPlayerView(state, 'retailer');
    const wholesalerRpcView = createPlayerView(state, 'wholesaler');

    // Retailer checks
    expect(retailerRpcView.myRole).toBe('retailer');
    expect(retailerRpcView.myState).toBeDefined();
    expect(retailerRpcView.myState?.inventory).toBe(12);
    expect(retailerRpcView.submittedThisRound).toBe(true);
    expect(retailerRpcView.roundSubmissions.retailer).toBe(true);
    expect(retailerRpcView.roundSubmissions.wholesaler).toBe(false);
    expect(retailerRpcView.finalResults).toBeUndefined();

    // Verify other role states are NOT leaked in view
    expect((retailerRpcView as any).roles).toBeUndefined();

    // Wholesaler checks
    expect(wholesalerRpcView.myRole).toBe('wholesaler');
    expect(wholesalerRpcView.submittedThisRound).toBe(false);
    expect(wholesalerRpcView.roundSubmissions.retailer).toBe(true);
    expect(wholesalerRpcView.roundSubmissions.wholesaler).toBe(false);
    expect(wholesalerRpcView.finalResults).toBeUndefined();
  });

  it('should expose complete game results once status is finished', () => {
    let state = createInitialGameState('game-vis-finish');
    ROLES.forEach((r) => {
      state.slots[r].occupied = true;
    });
    state = startGame(state);

    for (let r = 1; r <= 20; r++) {
      state = advanceRoundWithOrders(state, {
        retailer: 4,
        wholesaler: 4,
        distributor: 4,
        factory: 4,
      });
    }

    expect(state.status).toBe('finished');

    const finishedView = createPlayerView(state, 'retailer');
    expect(finishedView.finalResults).toBeDefined();
    expect(finishedView.finalResults?.totalCost).toBe(754);
    expect(finishedView.finalResults?.roles.retailer.totalCost).toBe(394);
    expect(finishedView.finalResults?.roles.wholesaler.totalCost).toBe(120);
  });
});
