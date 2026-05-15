# PackageTracker

A full-stack package tracking web app. Enter any tracking number — it auto-detects the carrier, registers the shipment, and keeps you updated on status across all major carriers.

## Features

- **Auto carrier detection** — UPS, FedEx, USPS, DHL, Amazon Logistics, OnTrac, LaserShip
- **Incoming & outgoing tracking** — filter and manage both directions
- **Table & card views** — toggle between a data-dense table and a card grid
- **On-demand & scheduled refresh** — bulk refresh all active packages; background job runs every 30 minutes
- **Natural language chat assistant** — ask questions like *"how many packages are in transit?"* or *"show me packages going to Texas"*
- **Mock mode** — works fully without an AfterShip API key using realistic demo data
- **Dark / light mode**

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite (better-sqlite3) |
| Tracking API | AfterShip v4 REST API |
| State management | TanStack Query |
| Routing | React Router v7 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/abhinandan8911/package-tracker.git
cd package-tracker
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Get a free key at https://www.aftership.com — 100 shipments/month free
# Leave as-is to run in mock mode with demo data (no API key needed)
AFTERSHIP_API_KEY=your_aftership_api_key_here

PORT=3001
```

> **Mock mode**: if `AFTERSHIP_API_KEY` is not set or left as the placeholder, the app runs fully with built-in demo data — no external API calls are made.

### Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Load demo data

Once running, click **"Seed demo data"** on the dashboard to load 10 sample packages across all carriers with realistic tracking histories.

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/packages` | List packages (`?direction=`, `?status=`, `?search=`) |
| `POST` | `/api/packages` | Add a new package (auto-detects carrier) |
| `POST` | `/api/packages/detect` | Detect carrier from tracking number |
| `GET` | `/api/packages/:id` | Get single package with full checkpoint history |
| `PUT` | `/api/packages/:id` | Update label, order ID, or direction |
| `POST` | `/api/packages/:id/refresh` | Fetch latest status from AfterShip |
| `DELETE` | `/api/packages/:id` | Archive (soft delete); `?hard=true` to permanently delete |
| `POST` | `/api/packages/refresh-all` | Refresh all active packages in bulk |
| `POST` | `/api/chat` | Natural language query against package data |
| `GET` | `/api/chat/suggestions` | Get suggested chat questions |
| `POST` | `/api/seed` | Seed demo packages (skips if data exists) |
| `POST` | `/api/seed/force` | Clear and re-seed demo data |

## Project Structure

```
tracker/
├── client/                  # Vite + React frontend
│   └── src/
│       ├── components/
│       │   ├── chat/        # Chat assistant panel
│       │   ├── layout/      # Header, theme toggle
│       │   ├── packages/    # Package cards, table, filters, add dialog
│       │   ├── shared/      # Status badge, carrier badge, empty state
│       │   └── tracking/    # Timeline + checkpoint components
│       ├── lib/             # API client, query client, utilities
│       └── pages/           # Dashboard, package detail
└── server/                  # Express backend
    └── src/
        ├── db/              # SQLite setup + migrations
        ├── routes/          # packages, chat, seed
        ├── services/        # AfterShip integration, mock data, chat engine, carrier detection
        └── scheduler.ts     # Background refresh job
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AFTERSHIP_API_KEY` | _(empty)_ | AfterShip API key; omit for mock mode |
| `PORT` | `3001` | Express server port |
| `DB_PATH` | `./tracker.db` | Path to SQLite database file |
| `REFRESH_INTERVAL_MS` | `1800000` | Background refresh interval in ms (default 30 min) |

## Integrating a Real LLM

The chat endpoint at `POST /api/chat` currently uses a local rule-based engine. To swap in OpenAI, Anthropic, or any other LLM:

1. Open `server/src/routes/chat.ts`
2. Replace the `answerQuery(message)` call with your LLM API call, passing the user's message plus package data as context
3. The frontend chat UI requires no changes

## License

MIT
