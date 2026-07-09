# CoinPulse — Fastify Backend

Node.js + Fastify REST API that proxies CoinGecko and GeckoTerminal data with caching, rate limiting, validation, and OpenAPI docs.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Fastify v4 |
| Language | TypeScript 5 |
| Validation | Zod |
| Caching | Redis (ioredis) or in-memory fallback |
| Logging | Pino (built into Fastify) |
| Docs | Swagger / OpenAPI 3 |

---

## Project Structure

```
server/
├── src/
│   ├── config.ts              # Env var validation (Zod)
│   ├── app.ts                 # Fastify app factory (plugins + routes)
│   ├── index.ts               # Entry point
│   ├── lib/
│   │   ├── cache.ts           # Redis / in-memory two-tier cache
│   │   ├── errors.ts          # Typed custom error classes
│   │   └── httpClient.ts      # Typed HTTP client (CoinGecko + GeckoTerminal)
│   ├── services/
│   │   ├── coins.service.ts   # All coin-related business logic
│   │   └── pools.service.ts   # DEX pool logic (GeckoTerminal)
│   ├── routes/
│   │   ├── coins.route.ts     # /api/coins/* route handlers
│   │   ├── pools.route.ts     # /api/pools/* route handlers
│   │   ├── health.route.ts    # /api/health
│   │   └── helpers.ts         # sendSuccess / sendError helpers
│   └── types/
│       ├── coingecko.ts       # CoinGecko + GeckoTerminal types
│       └── api.ts             # Response envelope types
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Setup

```bash
cd server

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start dev server (hot reload)
npm run dev

# 4. Build for production
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `4000` | Server port |
| `HOST` | No | `0.0.0.0` | Bind address |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `COINGECKO_BASE_URL` | No | `https://api.coingecko.com/api/v3` | CoinGecko REST base URL |
| `COINGECKO_API_KEY` | No | — | API key (`CG-...` = demo, otherwise pro) |
| `GECKOTERMINAL_BASE_URL` | No | `https://api.geckoterminal.com/api/v2` | GeckoTerminal base URL |
| `REDIS_URL` | No | — | Redis connection URL — falls back to memory cache |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in ms |

---

## API Reference

All routes are prefixed with `/api`. Full interactive docs at `/docs`.

### Coins

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/coins` | Paginated market list |
| `GET` | `/api/coins/:id` | Full coin details |
| `GET` | `/api/coins/:id/ohlc` | OHLC candlestick data |
| `GET` | `/api/coins/trending` | Trending coins, NFTs, categories |
| `GET` | `/api/coins/categories` | Top coin categories |
| `GET` | `/api/coins/price` | Bulk simple price lookup |
| `GET` | `/api/coins/search` | Search coins by name/symbol |

### Pools (GeckoTerminal)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/pools` | Get pool by coin ID (or network + address) |
| `GET` | `/api/pools/top` | Top pools for a token on a network |

### System

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Server health + cache info |
| `GET` | `/docs` | Swagger UI |

### Query Parameters

**`GET /api/coins`**
- `page` (default: 1, max: 250)
- `per_page` (default: 10, max: 250)
- `currency` (default: usd)
- `order` (default: market_cap_desc)
- `sparkline` (default: false)

**`GET /api/coins/:id/ohlc`**
- `days` — `1 | 7 | 14 | 30 | 90 | 180 | 365 | max` (default: 1)
- `currency` (default: usd)

**`GET /api/coins/price`**
- `ids` — comma-separated coin IDs (max 50, required)
- `currencies` (default: usd)

**`GET /api/coins/search`**
- `q` — search query (required, max 100 chars)

**`GET /api/pools`**
- `coin_id` — CoinGecko coin ID (required)
- `network` — GeckoTerminal network slug (optional)
- `address` — contract address (optional)

---

## Response Format

All endpoints return a consistent JSON envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "cached": true,
  "timestamp": 1720000000000
}
```

**Error:**
```json
{
  "success": false,
  "error": "Coin \"xyz\" not found",
  "statusCode": 404,
  "timestamp": 1720000000000
}
```

---

## Connecting to the Next.js Frontend

Add this to the Next.js `.env.local`:

```env
BACKEND_URL=http://localhost:4000
```

The frontend's `lib/coingecko.actions.ts` will automatically route all requests through the Fastify backend when `BACKEND_URL` is set.
