# Crypto Intel Papertrade

[中文文档](./README.zh-CN.md)

Crypto Intel Papertrade is a full-stack crypto intelligence and paper trading platform built with `Next.js + TypeScript`.

It is meant to be understandable for:

- people who only want to deploy it
- developers who want to run it locally and modify it

## What it does

- listens to Binance and OKX market data
- aggregates exchange announcements and RSS/news feeds
- supports email verification registration and password login
- supports spot and perpetual paper trading
- lets each user configure an OpenAI-compatible `baseUrl + apiKey + model`
- provides an admin panel for SMTP, AI defaults, data source settings, GitHub settings, and updates
- ships with install/update scripts for Linux deployment

## Services

- `web`
  frontend, admin console, and API routes
- `worker`
  market ingestion, news aggregation, AI execution, funding, and liquidation loops
- `postgres`
  application database
- `redis`
  realtime event bus for SSE and worker communication

## Fastest way to start on Ubuntu

If you want the shortest path, use the quickstart script.

It installs missing system dependencies, clones the repo, creates `.env`, generates secrets, and only requires:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Everything else can be configured later in the admin panel.

### One-command style quickstart

On a fresh Ubuntu server:

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

Default install directory:

```text
$HOME/crypto-intel-papertrade
```

After installation, open:

```text
http://your-server-ip:3000
```

Login with:

- email: the `ADMIN_EMAIL` value you provided
- password: the `ADMIN_PASSWORD` value you provided

## Full Ubuntu deployment steps

If you want to see every command and every step, use the detailed path below.

### Step 1: Connect to the server

```bash
ssh your-user@your-server-ip
```

### Step 2: Install Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

### Step 3: Install Docker Engine and Docker Compose plugin

These commands are aligned with the official Docker Ubuntu install guide.

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
sudo docker run hello-world
```

### Step 4: Optional, allow docker without sudo

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

If `newgrp docker` does not take effect, log out and SSH back in.

### Step 5: Clone the project

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### Step 6: Run the install script

This is now enough for a basic install:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/install.sh
```

What `install.sh` now does automatically:

- creates `.env` if it does not exist
- generates `AUTH_SECRET`
- generates `APP_ENCRYPTION_KEY`
- fills GitHub and GHCR defaults
- enables admin-triggered update script usage
- asks only for admin email and password if not passed in
- pulls GHCR images or falls back to local build
- starts PostgreSQL and Redis
- runs Prisma database setup
  If `prisma/migrations` exists, it uses `prisma migrate deploy`.
  If no migrations exist yet, it automatically falls back to `prisma db push`.
- starts `web` and `worker`

### Step 7: Configure the rest later in admin panel

After the first install, you can log in and configure later from the admin panel:

- SMTP settings
- AI base URL, API key, and model
- site settings
- maintenance mode
- source settings
- GitHub/GHCR update-related settings

## Local development

If you are another developer and want to run the project locally:

### Requirements

- `Node.js 22`
- `npm`
- `Docker`
- `Docker Compose`
- `Git`

### Step 1: Clone the repo

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### Step 2: Create `.env`

```bash
cp .env.example .env
```

For local development, the minimum useful values are:

```env
AUTH_SECRET=local-dev-secret
APP_ENCRYPTION_KEY=local-dev-encryption-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### Step 3: Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### Step 4: Install dependencies

```bash
npm install
```

### Step 5: Prepare the database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Step 6: Start the web app

```bash
npm run dev
```

### Step 7: Start the worker in another terminal

```bash
npm run worker
```

### Step 8: Open the site

```text
http://localhost:3000
```

## Updating the server later

After new code is pushed to `main`, update the server in one of these ways:

- click the update button in the admin panel
- or run this on the server:

```bash
cd ~/crypto-intel-papertrade
sh scripts/update.sh
```

`update.sh` will:

- pull the latest `main`
- move `IMAGE_TAG` to the latest commit SHA
- pull GHCR images or build locally if needed
- run database migration
- restart services
- health-check the app
- roll back if the health check fails

## Main pages

- `/`
  overview dashboard
- `/auth`
  registration and login
- `/market`
  market intelligence
- `/paper-trading`
  paper trading workspace
- `/ai-settings`
  user AI settings
- `/alerts`
  alerts and feed stream
- `/admin`
  admin console

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
docker compose up -d postgres redis
docker compose down
```

## Troubleshooting

### `docker: command not found`

Docker is not installed correctly, or your shell session needs to be reopened.

### `permission denied while trying to connect to the Docker daemon socket`

Run:

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

### `port 3000 is already in use`

Check what is using it:

```bash
sudo ss -ltnp | grep 3000
```

### Email codes are not arriving

If `SMTP_*` is empty, development mode falls back to preview mode and logs the code instead of sending real email.

## Important notes

- never commit real secrets to GitHub
- keep real values only in `.env` and admin-side encrypted storage
- the worker already has the main loops wired, but production hardening is still needed for retries, batching, rate limits, and exchange-specific edge cases

## References

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)
