# Crypto Intel Papertrade

A full-stack `Next.js + TypeScript` platform for:

- realtime Binance and OKX market monitoring
- exchange announcement and RSS/news aggregation
- email-based user onboarding
- spot and perpetual paper trading
- per-user OpenAI-compatible AI auto-execution
- admin-controlled SMTP, GitHub, GHCR, and update settings
- Linux deployment with Docker Compose, `install.sh`, and `update.sh`

## Stack

- `Next.js 16` app router
- `Prisma + PostgreSQL`
- `Redis` for event fan-out
- `ws` connectors for Binance and OKX streams
- `Vitest` for unit coverage
- `GitHub Actions + GHCR` for image publishing

## Main routes

- `/` overview dashboard
- `/auth` registration and login
- `/market` live market intelligence
- `/paper-trading` manual paper execution
- `/ai-settings` user AI config
- `/alerts` unified alert queue
- `/admin` and nested admin pages

## Local development

1. Copy `.env.example` to `.env` and adjust secrets.
2. Start infrastructure:

```bash
docker compose up -d postgres redis
```

3. Install and prepare the database:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

4. Run the web app and worker in separate terminals:

```bash
npm run dev
npm run worker
```

## Deploy with Docker Compose

The repo is designed for a Linux host. Typical flow:

```bash
export GITHUB_OWNER=weige0831
git clone https://github.com/$GITHUB_OWNER/crypto-intel-papertrade.git
cd crypto-intel-papertrade
cp .env.example .env
./scripts/install.sh
```

The admin update endpoint triggers `scripts/update.sh`, which:

- pulls the latest `main`
- resolves the newest commit SHA
- switches `IMAGE_TAG`
- pulls GHCR images
- runs Prisma deploy migrations
- restarts `web` and `worker`
- rolls back the previous `IMAGE_TAG` if health checks fail

## GitHub release flow

On every push to `main`, GitHub Actions:

1. installs dependencies
2. runs Prisma generate
3. runs lint and tests
4. builds the app
5. builds and pushes:
   - `ghcr.io/<owner>/crypto-intel-papertrade:main`
   - `ghcr.io/<owner>/crypto-intel-papertrade:<commit-sha>`

## Important notes

- AI keys and SMTP passwords are encrypted at rest in the database.
- The public repository must never contain real `.env` values.
- The worker implementation is a production-oriented skeleton: it already wires live streams, polling, AI execution, funding, and liquidation loops, but you should still harden rate limits, batching, and exchange-specific edge cases before treating it as production trading infrastructure.
