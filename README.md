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
