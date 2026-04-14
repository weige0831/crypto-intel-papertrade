# Crypto Intel Papertrade

[中文说明](./README.zh-CN.md)

Crypto Intel Papertrade is a `Next.js + TypeScript` platform for:

- official Binance and OKX market ingestion
- exchange announcement and RSS/news aggregation
- email-code onboarding
- spot and perpetual paper trading
- user-level AI execution settings
- an admin console with script-based updates

## What changed in the current build

- public auth is split into:
  - `/auth/login`
  - `/auth/register`
  - `/auth/forgot-password`
- `/auth` now redirects to `/auth/login`
- the public header only exposes `Sign in` and `Register`
- the admin entry is hidden from public navigation and must be opened manually at `/admin`
- the homepage and alerts page are now intel-first, instead of dumping raw `market_tick` events
- a server command exists to force-reset the admin account

## Runtime services

- `web`: frontend, admin pages, API routes, SSE
- `worker`: market ingestion, intel collection, AI execution, simulation loops
- `postgres`: application database
- `redis`: event bus and realtime fan-out

## Fast Ubuntu deployment

On a clean Ubuntu server:

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

The quickstart script installs missing dependencies, clones the repo, creates `.env`, generates secrets, seeds the database, resets the admin account, and starts the stack.

Default install directory:

```text
$HOME/crypto-intel-papertrade
```

## Manual Ubuntu deployment

### 1. Install Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

### 2. Install Docker Engine and Docker Compose plugin

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Optional, allow the current user to run Docker without `sudo`:

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone the project

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
git config core.fileMode false
```

### 4. Run install

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/install.sh
```

`install.sh` will:

- create `.env` from `.env.example` when missing
- generate `AUTH_SECRET`
- generate `APP_ENCRYPTION_KEY`
- set GitHub/GHCR defaults
- start PostgreSQL and Redis
- retry GHCR pulls before falling back to local builds
- run `prisma migrate deploy` when migrations exist
- fall back to `prisma db push` when they do not
- seed system defaults
- force-create or reset the admin account with `npm run admin:reset`
- start `web` and `worker`

## Updating the server

```bash
cd ~/crypto-intel-papertrade
sh scripts/update.sh
```

`update.sh` now:

- pulls the latest `main`
- updates `IMAGE_TAG`
- retries GHCR pulls before local build fallback
- syncs the embedded PostgreSQL password from `.env`
- runs Prisma migrations or `db push`
- restarts the stack
- checks `/api/health`
- rolls back on failure

## Resetting the admin account

Use this on the server when the admin email or password needs to be recovered:

```bash
cd ~/crypto-intel-papertrade
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/reset-admin.sh
```

This command updates `.env`, ensures the user is `ADMIN`, marks the email as verified, and ensures a primary paper portfolio exists.

## Local development

### 1. Clone and prepare `.env`

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
cp .env.example .env
```

Minimum useful values:

```env
AUTH_SECRET=local-dev-secret
APP_ENCRYPTION_KEY=local-dev-encryption-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 2. Start infra

```bash
docker compose up -d postgres redis
```

### 3. Install and bootstrap

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run admin:reset
```

### 4. Start app

```bash
npm run dev
```

In another terminal:

```bash
npm run worker
```

## Main routes

- `/`
- `/market`
- `/market/[instrument]`
- `/alerts`
- `/paper-trading`
- `/ai-settings`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/admin`

## Common commands

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
npm run admin:reset
sh scripts/install.sh
sh scripts/update.sh
sh scripts/reset-admin.sh
```

## References

- [Binance Spot REST market data](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
- [Binance WebSocket streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams)
- [OKX API v5 docs](https://my.okx.com/docs-v5/en/)
- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
