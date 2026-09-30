import { Role, RoleState } from './types';

/**
 * Calculates an intelligent base-stock order decision for a bot player.
 * Aims to balance incoming demand while stabilizing inventory toward the target (12).
 */
export function calculateBotOrder(_role: Role, roleState: RoleState, _round: number): number {
  const targetInventory = 12;
  const currentInventory = roleState.inventory;
  const currentBacklog = roleState.backlog;
  const incomingDemand = roleState.incomingOrder;

  // Base-stock / anchor-and-adjust heuristic
  const inventoryDeficit = targetInventory - currentInventory;
  const rawOrder = incomingDemand + Math.round(0.5 * inventoryDeficit + 0.5 * currentBacklog);

  return Math.max(0, rawOrder);
}
