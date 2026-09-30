export const ROLES = ['retailer', 'wholesaler', 'distributor', 'factory'] as const;
export type Role = (typeof ROLES)[number];

export const TOTAL_ROUNDS = 20;
export const INITIAL_INVENTORY = 12;
export const INITIAL_BACKLOG = 0;
export const INITIAL_SHIPMENTS_IN_TRANSIT = [4, 4];
export const INITIAL_LAST_ORDER_PLACED = 4;
export const INVENTORY_HOLDING_COST = 0.5;
export const BACKLOG_PENALTY_COST = 1.0;

export interface RoleState {
  inventory: number;
  backlog: number;
  shipmentsInTransit: [number, number]; // [arriving this round, arriving next round]
  lastOrderPlaced: number;
  roundCost: number;
  totalCost: number;
  shipmentArrived: number;
  incomingOrder: number;
  shipped: number;
}

export interface RoleRoundRecord {
  round: number;
  shipmentArrived: number;
  incomingOrder: number;
  shipped: number;
  inventory: number;
  backlog: number;
  roundCost: number;
  totalCost: number;
  orderPlaced: number;
}

export type GameStatus = 'lobby' | 'active' | 'finished';

export interface PlayerSlot {
  role: Role;
  occupied: boolean;
  playerName: string;
  isBot: boolean;
  sessionToken?: string;
  connected: boolean;
}

export interface GameState {
  id: string;
  status: GameStatus;
  currentRound: number; // 0 in lobby, 1-20 in active, 20 in finished
  totalRounds: number;
  roles: Record<Role, RoleState>;
  pendingOrders: Partial<Record<Role, number>>;
  orderHistory: Record<Role, number[]>;
  history: Record<Role, RoleRoundRecord[]>;
  slots: Record<Role, PlayerSlot>;
  createdAt: number;
  updatedAt: number;
}

export interface SlotPublicInfo {
  role: Role;
  occupied: boolean;
  playerName: string;
  isBot: boolean;
  connected: boolean;
}

export interface FinalRoleSummary {
  role: Role;
  inventory: number;
  backlog: number;
  totalCost: number;
  history: RoleRoundRecord[];
}

export interface FinalResults {
  roles: Record<Role, FinalRoleSummary>;
  totalCost: number;
  bestRole: Role;
}

export interface PlayerView {
  gameId: string;
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  myRole: Role | null;
  myState: RoleState | null;
  myHistory: RoleRoundRecord[];
  submittedThisRound: boolean;
  roundSubmissions: Record<Role, boolean>;
  slots: Record<Role, SlotPublicInfo>;
  finalResults?: FinalResults;
}

export type ClientMessage =
  | { type: 'JOIN_LOBBY'; payload: { gameId: string; sessionToken: string; playerName?: string; preferredRole?: Role } }
  | { type: 'SELECT_ROLE'; payload: { role: Role } }
  | { type: 'FILL_BOTS' }
  | { type: 'SUBMIT_ORDER'; payload: { amount: number } }
  | { type: 'PING' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; payload: PlayerView }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'PONG' };
