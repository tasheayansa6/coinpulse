# CoinPulse 🚀

A professional cryptocurrency screener and dashboard with real-time data, live charts, DEX trading feeds, watchlist, and price alerts.

---

## Project Structure

```
coinpulse/
├── frontend/     ← Next.js 16 + React 19 + TypeScript
└── backend/      ← Node.js + Fastify 5 + MongoDB + TypeScript
```

---

## Features

- 📈 **Live Candlestick Charts** — powered by `lightweight-charts` with 1D/1W/1M/3M/6M/1Y/Max periods
- ⚡ **Real-time Price Feed** — CoinGecko Pro WebSocket (price, trades, OHLCV)
- 🔍 **Search** — Cmd+K modal with debounced search, live prices in results
- 🏆 **Top Gainers/Losers** — 24h performance leaders
- ⭐ **Watchlist** — Save and track your favorite coins
- 🔔 **Price Alerts** — Get notified when a coin crosses your target price
- 💱 **Converter** — Multi-currency converter on coin detail pages
- 🗂️ **Categories** — Top coin categories with market cap and volume
- 🌊 **DEX Pool Data** — GeckoTerminal integration for on-chain trading data
- 📊 **All Coins** — Paginated market list (100+ pages)
- 🔒 **Rate Limiting** — Built-in protection on the backend
- 🗄️ **MongoDB** — Persistent watchlist and alerts storage
- ⚡ **Caching** — Two-tier cache (Redis or in-memory fallback)

---

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
echo "BACKEND_URL=http://localhost:4000" >> .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000" >> .env.local
npm run dev            # starts on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4000) |
| `COINGECKO_BASE_URL` | CoinGecko REST API base URL |
| `COINGECKO_API_KEY` | Optional API key (demo or pro) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis URL (optional, falls back to memory) |
| `CORS_ORIGINS` | Allowed origins (comma-separated) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `BACKEND_URL` | Backend URL for server-side calls |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL for client-side calls |
| `NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL` | CoinGecko Pro WebSocket URL |
| `NEXT_PUBLIC_COINGECKO_API_KEY` | CoinGecko Pro API key (for WebSocket) |

---

## API Reference

Backend Swagger docs available at **http://localhost:4000/docs**

| Endpoint | Description |
|---|---|
| `GET /api/coins` | Paginated market list |
| `GET /api/coins/:id` | Full coin details |
| `GET /api/coins/:id/ohlc` | OHLC candlestick data |
| `GET /api/coins/trending` | Trending coins |
| `GET /api/coins/categories` | Top categories |
| `GET /api/coins/search?q=` | Search coins |
| `GET /api/coins/price?ids=` | Bulk price check |
| `GET /api/pools` | DEX pool data |
| `GET/POST/DELETE /api/watchlist` | Manage watchlist |
| `GET/POST/DELETE /api/alerts` | Manage price alerts |
| `GET /api/health` | Server health check |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Fastify 5, TypeScript |
| Database | MongoDB Atlas (Mongoose 8) |
| Cache | Redis / in-memory fallback |
| Charts | lightweight-charts 5 |
| Real-time | CoinGecko Pro WebSocket |
| Validation | Zod |
| Docs | Swagger / OpenAPI 3 |
