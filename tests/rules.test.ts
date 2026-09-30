import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  advanceRoundWithOrders,
  createInitialGameState,
  getCustomerDemand,
  ROLES,
  startGame,
  validateOrder,
} from '../src/core';

describe('Beer Game Core Rules', () => {
  it('should validate order inputs correctly', () => {
    expect(validateOrder(4).valid).toBe(true);
    expect(validateOrder(0).valid).toBe(true);
    expect(validateOrder(100).valid).toBe(true);

    expect(validateOrder(-1).valid).toBe(false);
    expect(validateOrder(3.5).valid).toBe(false);
    expect(validateOrder('4' as any).valid).toBe(false);
    expect(validateOrder(null as any).valid).toBe(false);
    expect(validateOrder(undefined as any).valid).toBe(false);
    expect(validateOrder(1001).valid).toBe(false);
  });

  it('should return correct customer demand per round schedule', () => {
    for (let r = 1; r <= 4; r++) {
      expect(getCustomerDemand(r)).toBe(4);
    }
    for (let r = 5; r <= 20; r++) {
      expect(getCustomerDemand(r)).toBe(8);
    }
  });

  it('should match fixtures/everyone-orders-four.json exactly across all 20 rounds', () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/everyone-orders-four.json');
    const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    let state = createInitialGameState('test-game-1');

    // Fill all 4 slots to allow starting
    ROLES.forEach((role) => {
      state.slots[role].occupied = true;
      state.slots[role].playerName = `Player ${role}`;
    });

    state = startGame(state);

    for (let r = 0; r < fixtureData.rounds.length; r++) {
      const fixtureRound = fixtureData.rounds[r];
      const roundNum = fixtureRound.round;

      expect(state.currentRound).toBe(roundNum);
      expect(state.status).toBe('active');

      // Check each role's metrics for this round
      for (const role of ROLES) {
        const roleFixture = fixtureRound[role];
        const roleState = state.roles[role];

        expect(roleState.shipmentArrived).toBe(roleFixture.shipmentArrived);
        expect(roleState.incomingOrder).toBe(roleFixture.incomingOrder);
        expect(roleState.shipped).toBe(roleFixture.shipped);
        expect(roleState.inventory).toBe(roleFixture.inventory);
        expect(roleState.backlog).toBe(roleFixture.backlog);
        expect(roleState.roundCost).toBe(roleFixture.roundCost);
        expect(roleState.totalCost).toBe(roleFixture.totalCost);
      }

      // Submit order of 4 for every role
      const orders = {
        retailer: 4,
        wholesaler: 4,
        distributor: 4,
        factory: 4,
      };

      state = advanceRoundWithOrders(state, orders);
    }

    expect(state.status).toBe('finished');
    expect(state.roles.retailer.totalCost).toBe(394);
    expect(state.roles.wholesaler.totalCost).toBe(120);
    expect(state.roles.distributor.totalCost).toBe(120);
    expect(state.roles.factory.totalCost).toBe(120);

    const totalCost =
      state.roles.retailer.totalCost +
      state.roles.wholesaler.totalCost +
      state.roles.distributor.totalCost +
      state.roles.factory.totalCost;

    expect(totalCost).toBe(754);
    expect(totalCost).toBe(fixtureData.totalCost);
  });

  it('should verify propagation delay when Retailer orders 8 from round 5 onward', () => {
    // According to EXAMPLE.md:
    // "if the Retailer orders 8 from round 5 onward and everyone else keeps ordering 4,
    // the Wholesaler first receives an order of 8 in round 6 and the Retailer first receives a shipment of 8 in round 8."
    let state = createInitialGameState('test-delay-game');
    ROLES.forEach((r) => {
      state.slots[r].occupied = true;
    });
    state = startGame(state);

    for (let r = 1; r <= 8; r++) {
      if (r === 6) {
        expect(state.roles.wholesaler.incomingOrder).toBe(8);
      } else if (r < 6) {
        expect(state.roles.wholesaler.incomingOrder).toBe(4);
      }

      if (r === 8) {
        expect(state.roles.retailer.shipmentArrived).toBe(8);
      } else if (r < 8) {
        expect(state.roles.retailer.shipmentArrived).toBe(4);
      }

      const retailerOrder = r >= 5 ? 8 : 4;
      state = advanceRoundWithOrders(state, {
        retailer: retailerOrder,
        wholesaler: 4,
        distributor: 4,
        factory: 4,
      });
    }
  });
});
