import { calculateFinalResults } from './rules';
import { GameState, PlayerView, Role, SlotPublicInfo } from './types';

/**
 * Creates a sanitized, server-enforced player-specific view of the game state.
 *
 * During active gameplay, players CANNOT see other roles' inventory, backlog,
 * shipments, orders, or costs. They only see boolean submission indicators.
 * Full game results are only revealed once the game transitions to 'finished'.
 */
export function createPlayerView(state: GameState, targetRole: Role | null): PlayerView {
  // Public slots info (strips sessionTokens)
  const slots: Record<Role, SlotPublicInfo> = {
    retailer: {
      role: 'retailer',
      occupied: state.slots.retailer.occupied,
      playerName: state.slots.retailer.playerName,
      isBot: state.slots.retailer.isBot,
      connected: state.slots.retailer.connected,
    },
    wholesaler: {
      role: 'wholesaler',
      occupied: state.slots.wholesaler.occupied,
      playerName: state.slots.wholesaler.playerName,
      isBot: state.slots.wholesaler.isBot,
      connected: state.slots.wholesaler.connected,
    },
    distributor: {
      role: 'distributor',
      occupied: state.slots.distributor.occupied,
      playerName: state.slots.distributor.playerName,
      isBot: state.slots.distributor.isBot,
      connected: state.slots.distributor.connected,
    },
    factory: {
      role: 'factory',
      occupied: state.slots.factory.occupied,
      playerName: state.slots.factory.playerName,
      isBot: state.slots.factory.isBot,
      connected: state.slots.factory.connected,
    },
  };

  // Submission status map: strictly boolean indicators without values
  const roundSubmissions: Record<Role, boolean> = {
    retailer: typeof state.pendingOrders.retailer === 'number',
    wholesaler: typeof state.pendingOrders.wholesaler === 'number',
    distributor: typeof state.pendingOrders.distributor === 'number',
    factory: typeof state.pendingOrders.factory === 'number',
  };

  const myState = targetRole ? state.roles[targetRole] || null : null;
  const myHistory = targetRole ? state.history[targetRole] || [] : [];
  const submittedThisRound = targetRole ? roundSubmissions[targetRole] : false;

  const view: PlayerView = {
    gameId: state.id,
    status: state.status,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    myRole: targetRole,
    myState: myState ? { ...myState } : null,
    myHistory: [...myHistory],
    submittedThisRound,
    roundSubmissions,
    slots,
  };

  // Only expose all role metrics once game is finished
  if (state.status === 'finished') {
    view.finalResults = calculateFinalResults(state);
  }

  return view;
}
