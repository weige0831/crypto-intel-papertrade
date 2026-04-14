# Crypto Intel Papertrade

[中文说明](./README.zh-CN.md)

A full-stack `Next.js + TypeScript` platform for:

- realtime Binance and OKX market monitoring
- exchange announcement and RSS/news aggregation
- email-based onboarding with verification codes
- spot and perpetual paper trading
- per-user OpenAI-compatible AI auto-execution
- admin-controlled SMTP, GitHub, GHCR, and update settings
- Linux deployment with Docker Compose, `install.sh`, and `update.sh`

## What it includes

- `web`: frontend, admin console, and API routes
- `worker`: market ingestion, news aggregation, AI execution, funding, and liquidation loops
- `postgres`: business database
- `redis`: realtime event fan-out for SSE and worker communication

## Quick deploy

Target: Linux server with `git`, `docker`, and `docker compose`.

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
cp .env.example .env
```

Edit `.env` at minimum:

- `AUTH_SECRET`
- `APP_ENCRYPTION_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `OPENAI_COMPAT_API_KEY` if AI auto-execution is needed
- `SMTP_*` if real email delivery is needed

Then run:

```bash
chmod +x scripts/install.sh scripts/update.sh
GITHUB_OWNER=weige0831 ./scripts/install.sh
```

After install:

- web UI: `http://<your-server-ip>:3000`
- admin login: `.env` values from `ADMIN_EMAIL` and `ADMIN_PASSWORD`

## Quick local run

```bash
docker compose up -d postgres redis
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

Start the app and worker in separate terminals:

```bash
npm run dev
npm run worker
```

## Update flow

Production update is intentionally simple:

1. Push confirmed changes to `main`
2. GitHub Actions builds and publishes GHCR images
3. Admin panel triggers `/api/admin/update`
4. Server runs `scripts/update.sh`
5. Compose pulls the new image, runs migrations, restarts services, and health-checks the app

If health checks fail, `update.sh` rolls back to the previous `IMAGE_TAG`.

## Main routes

- `/` overview dashboard
- `/auth` registration and login
- `/market` live market intelligence
- `/paper-trading` manual paper execution
- `/ai-settings` user AI config
- `/alerts` unified alert queue
- `/admin` and nested admin pages

## Main commands

```bash
npm run dev
npm run worker
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
```

## Important notes

- Real secrets must never be committed. Use `.env` and admin-side encrypted storage.
- AI and SMTP secrets are encrypted before being stored in the database.
- The worker is a strong production-oriented skeleton, but exchange-specific hardening, batching, and operational limits should still be tightened before treating it as a finished live service.
