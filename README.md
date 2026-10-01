# Beer Distribution Game

Multiplayer supply-chain game (React, TypeScript, Node.js, SQLite, WebSockets).

Four roles — **Retailer → Wholesaler → Distributor → Factory** — play **20 rounds**. Each player orders upstream to balance inventory holding cost (`0.5`) vs backlog penalty (`1.0`). Customer demand is **4** for rounds 1–4, then **8** for rounds 5–20. Delays (orders: 1 round, shipments: 2 rounds) create the bullwhip effect.

## Run

```bash
pnpm install
pnpm approve-builds   # allow better-sqlite3 (+ esbuild) if prompted
pnpm install
pnpm dev              # client :5173, API/WS :3001
```

Open http://localhost:5173

```bash
pnpm test             # run tests
pnpm build && pnpm start   # production on :3001
```

## Play

1. Create a room (4-letter code) or join with a code.
2. Fill empty slots with AI bots, or open all 4 roles in separate tabs.
3. Each round, submit an order. When all four roles order, the round advances.
4. After round 20, see costs and the bullwhip chart.

## Layout

| Path | Role |
|---|---|
| `src/core/` | Pure game rules (no UI/HTTP) |
| `src/server/` | Express API, WebSockets, SQLite |
| `src/client/` | React lobby, game, results UI |

## Implementation notes

- **Authoritative server:** clients send intents (`SUBMIT_ORDER`, `JOIN_LOBBY`, etc.); the server owns state and broadcasts role-scoped `PlayerView`s over WebSockets.
- **Visibility:** during play, each player only sees their own inventory/backlog/costs; peers only get boolean “submitted” flags. Full cross-role history unlocks when `status === 'finished'`.
- **Persistence:** SQLite (`better-sqlite3`) stores game JSON + session tokens so refresh/reconnect restores the same role.
- **Bots:** empty lobby slots can be filled with a base-stock heuristic so one person can finish a full game.
- **Tests:** `pnpm test` checks the `everyone-orders-four` fixture (total cost **754**), delay propagation from `EXAMPLE.md`, visibility redaction, and game-manager persistence.

## AI assistance disclosure

An AI coding assistant (Cursor) was used to help scaffold the app structure, implement game rules against `EXAMPLE.md` / fixtures, build the React UI and WebSocket sync, write tests, and fix build/auth/visibility issues. Game math, delays, costs, and behavior were verified with automated tests and manual play.
