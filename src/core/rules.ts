import {
  BACKLOG_PENALTY_COST,
  FinalResults,
  GameState,
  INITIAL_BACKLOG,
  INITIAL_INVENTORY,
  INITIAL_LAST_ORDER_PLACED,
  INITIAL_SHIPMENTS_IN_TRANSIT,
  INVENTORY_HOLDING_COST,
  Role,
  ROLES,
  RoleRoundRecord,
  RoleState,
  TOTAL_ROUNDS,
} from './types';

/**
 * Returns customer demand for a given round.
 * Rounds 1-4: 4 units
 * Rounds 5-20: 8 units
 */
export function getCustomerDemand(round: number): number {
  if (round <= 4) {
    return 4;
  }
  return 8;
}

/**
 * Validates that an order is a non-negative integer.
 */
export function validateOrder(amount: unknown): { valid: boolean; error?: string; value?: number } {
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
    return {
      valid: false,
      error: 'Order must be an integer greater than or equal to 0',
    };
  }
  if (amount > 1000) {
    return {
      valid: false,
      error: 'Order exceeds maximum allowable limit (1000)',
    };
  }
  return { valid: true, value: amount };
}

/**
 * Creates initial role state before round 1.
 */
export function createInitialRoleState(): RoleState {
  return {
    inventory: INITIAL_INVENTORY,
    backlog: INITIAL_BACKLOG,
    shipmentsInTransit: [
      INITIAL_SHIPMENTS_IN_TRANSIT[0],
      INITIAL_SHIPMENTS_IN_TRANSIT[1],
    ],
    lastOrderPlaced: INITIAL_LAST_ORDER_PLACED,
    roundCost: 0,
    totalCost: 0,
    shipmentArrived: 0,
    incomingOrder: 0,
    shipped: 0,
  };
}

/**
 * Creates initial empty game state in lobby phase.
 */
export function createInitialGameState(id: string): GameState {
  const roles: Record<Role, RoleState> = {
    retailer: createInitialRoleState(),
    wholesaler: createInitialRoleState(),
    distributor: createInitialRoleState(),
    factory: createInitialRoleState(),
  };

  const slots = {
    retailer: { role: 'retailer' as Role, occupied: false, playerName: '', isBot: false, connected: false },
    wholesaler: { role: 'wholesaler' as Role, occupied: false, playerName: '', isBot: false, connected: false },
    distributor: { role: 'distributor' as Role, occupied: false, playerName: '', isBot: false, connected: false },
    factory: { role: 'factory' as Role, occupied: false, playerName: '', isBot: false, connected: false },
  };

  return {
    id,
    status: 'lobby',
    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,
    roles,
    pendingOrders: {},
    orderHistory: {
      retailer: [],
      wholesaler: [],
      distributor: [],
      factory: [],
    },
    history: {
      retailer: [],
      wholesaler: [],
      distributor: [],
      factory: [],
    },
    slots,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Executes steps 1-4 of a round for all 4 roles simultaneously:
 * 1. Shipments arrive (2-round delay)
 * 2. Orders arrive (Retailer: customer demand, others: downstream's last order)
 * 3. Ship (min(inventory, backlog + incomingOrder))
 * 4. Charge costs (0.5 * inventory + 1.0 * backlog)
 *
 * This brings the game to Step 5: waiting for players to submit orders.
 */
export function executeRoundSteps1To4(state: GameState, roundNumber: number): GameState {
  const customerDemand = getCustomerDemand(roundNumber);

  // Incoming orders for this round
  const incomingOrders: Record<Role, number> = {
    retailer: customerDemand,
    wholesaler: state.roles.retailer.lastOrderPlaced,
    distributor: state.roles.wholesaler.lastOrderPlaced,
    factory: state.roles.distributor.lastOrderPlaced,
  };

  const updatedRoles = { ...state.roles };
  const shipmentsSent: Record<Role, number> = {
    retailer: 0,
    wholesaler: 0,
    distributor: 0,
    factory: 0,
  };

  // Step 1, 2, 3, 4 for each role
  for (const role of ROLES) {
    const prev = state.roles[role];

    // Step 1: Shipment arrives
    const shipmentArrived = prev.shipmentsInTransit[0];
    const inventoryAfterArrival = prev.inventory + shipmentArrived;

    // Step 2: Order arrives
    const incomingOrder = incomingOrders[role];

    // Step 3: Ship
    const totalRequirement = prev.backlog + incomingOrder;
    const shipped = Math.min(inventoryAfterArrival, totalRequirement);
    const newInventory = inventoryAfterArrival - shipped;
    const newBacklog = totalRequirement - shipped;

    shipmentsSent[role] = shipped;

    // Step 4: Charge costs
    const roundCost = INVENTORY_HOLDING_COST * newInventory + BACKLOG_PENALTY_COST * newBacklog;
    const newTotalCost = prev.totalCost + roundCost;

    // Shift transit pipeline: the item arriving next round becomes index 0, index 1 will be filled below
    const nextShipmentsInTransit: [number, number] = [prev.shipmentsInTransit[1], 0];

    updatedRoles[role] = {
      inventory: newInventory,
      backlog: newBacklog,
      shipmentsInTransit: nextShipmentsInTransit,
      lastOrderPlaced: prev.lastOrderPlaced,
      roundCost,
      totalCost: newTotalCost,
      shipmentArrived,
      incomingOrder,
      shipped,
    };
  }

  // Update in-transit shipments (2-round shipping delay: sent in round R arrives in round R+2)
  // Retailer receives shipment from Wholesaler
  updatedRoles.retailer.shipmentsInTransit[1] = shipmentsSent.wholesaler;

  // Wholesaler receives shipment from Distributor
  updatedRoles.wholesaler.shipmentsInTransit[1] = shipmentsSent.distributor;

  // Distributor receives shipment from Factory
  updatedRoles.distributor.shipmentsInTransit[1] = shipmentsSent.factory;

  // Factory's supplier is unlimited: always ships exactly what Factory ordered last round
  updatedRoles.factory.shipmentsInTransit[1] = state.roles.factory.lastOrderPlaced;

  return {
    ...state,
    currentRound: roundNumber,
    status: 'active',
    roles: updatedRoles,
    pendingOrders: {},
    updatedAt: Date.now(),
  };
}

/**
 * Checks if all 4 roles have placed orders for the current round.
 */
export function areAllOrdersSubmitted(pendingOrders: Partial<Record<Role, number>>): boolean {
  return ROLES.every((role) => typeof pendingOrders[role] === 'number');
}

/**
 * Computes final summary results when game finishes after round 20.
 */
export function calculateFinalResults(state: GameState): FinalResults {
  let totalCost = 0;
  let bestRole: Role = 'retailer';
  let minCost = Infinity;

  const rolesSummary = {} as Record<Role, { role: Role; inventory: number; backlog: number; totalCost: number; history: RoleRoundRecord[] }>;

  for (const role of ROLES) {
    const roleState = state.roles[role];
    const roleTotalCost = roleState.totalCost;
    totalCost += roleTotalCost;

    if (roleTotalCost < minCost) {
      minCost = roleTotalCost;
      bestRole = role;
    }

    rolesSummary[role] = {
      role,
      inventory: roleState.inventory,
      backlog: roleState.backlog,
      totalCost: roleTotalCost,
      history: state.history[role],
    };
  }

  return {
    roles: rolesSummary,
    totalCost,
    bestRole,
  };
}

/**
 * Advances the game when all 4 players have submitted their orders:
 * - Records round history
 * - Updates lastOrderPlaced
 * - If currentRound < 20, runs steps 1-4 for currentRound + 1
 * - If currentRound === 20, sets status to 'finished'
 */
export function advanceRoundWithOrders(state: GameState, orders: Record<Role, number>): GameState {
  if (state.status !== 'active') {
    throw new Error(`Cannot advance game when status is ${state.status}`);
  }

  const roundNum = state.currentRound;
  const newHistory = { ...state.history };
  const newOrderHistory = { ...state.orderHistory };
  const updatedRoles = { ...state.roles };

  // 1. Record history for the completed round
  for (const role of ROLES) {
    const rState = updatedRoles[role];
    const orderPlaced = orders[role];

    const record: RoleRoundRecord = {
      round: roundNum,
      shipmentArrived: rState.shipmentArrived,
      incomingOrder: rState.incomingOrder,
      shipped: rState.shipped,
      inventory: rState.inventory,
      backlog: rState.backlog,
      roundCost: rState.roundCost,
      totalCost: rState.totalCost,
      orderPlaced,
    };

    newHistory[role] = [...(newHistory[role] || []), record];
    newOrderHistory[role] = [...(newOrderHistory[role] || []), orderPlaced];

    // Update last order placed
    updatedRoles[role] = {
      ...rState,
      lastOrderPlaced: orderPlaced,
    };
  }

  const stateWithOrders: GameState = {
    ...state,
    roles: updatedRoles,
    history: newHistory,
    orderHistory: newOrderHistory,
    pendingOrders: {},
    updatedAt: Date.now(),
  };

  // 2. Check if game is finished (after 20 rounds)
  if (roundNum >= TOTAL_ROUNDS) {
    return {
      ...stateWithOrders,
      status: 'finished',
    };
  }

  // 3. Otherwise execute steps 1-4 for next round
  return executeRoundSteps1To4(stateWithOrders, roundNum + 1);
}

/**
 * Starts game from lobby phase into Round 1.
 */
export function startGame(state: GameState): GameState {
  if (state.status !== 'lobby') {
    throw new Error('Game can only start from lobby');
  }

  const allOccupied = ROLES.every((r) => state.slots[r].occupied);
  if (!allOccupied) {
    throw new Error('All 4 roles must be taken to start the game');
  }

  return executeRoundSteps1To4(state, 1);
}
