# Crypto Intel Papertrade

[中文说明](./README.zh-CN.md)

Crypto Intel Papertrade is a full-stack crypto intelligence and paper trading platform built with `Next.js + TypeScript`.

It is designed for two groups:

- operators who just want to deploy it on a Linux server
- developers who want to run it locally and extend it

## What it does

- listens to Binance and OKX market data
- aggregates exchange notices and RSS/news feeds
- supports email verification registration and password login
- supports spot and perpetual paper trading
- lets each user configure an OpenAI-compatible `baseUrl + apiKey + model`
- provides an admin panel for SMTP, AI defaults, source settings, and system updates
- ships with install and update scripts for Linux deployment

## Services

- `web`: frontend, user pages, admin pages, and API routes
- `worker`: market ingestion, news collection, AI execution, funding, and liquidation loops
- `postgres`: application database
- `redis`: realtime event bus for SSE and worker communication

## UI behavior

- normal users should use the top-right `Sign in / Register` entry
- registration and login live on the dedicated `/auth` page
- the admin console is intentionally hidden from public navigation
- administrators reach it manually through `/admin`, which redirects to the admin sign-in flow when needed

## Fastest Ubuntu start

On a fresh Ubuntu server:

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

The quickstart script installs missing system dependencies, clones the repo, creates `.env`, generates secrets, and prepares the app.

Default install directory:

```text
$HOME/crypto-intel-papertrade
```

After installation, open:

```text
http://your-server-ip:3000
```

## Full Ubuntu deployment

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

### Step 4: Optional, allow Docker without sudo

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
git config core.fileMode false
```

### Step 6: Run the install script

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/install.sh
```

`install.sh` will:

- create `.env` if needed
- generate `AUTH_SECRET`
- generate `APP_ENCRYPTION_KEY`
- fill GitHub and GHCR defaults
- start PostgreSQL and Redis
- retry GHCR pulls before falling back to local Docker builds
- keep the embedded PostgreSQL password aligned with `DATABASE_URL`
- use `prisma migrate deploy` when migrations exist
- automatically fall back to `prisma db push` when migrations do not exist yet
- seed the admin account and start `web` and `worker`

### Step 7: Configure the rest in the admin panel

After first install, log in with the admin account you created and configure:

- SMTP settings
- AI provider defaults
- source settings
- maintenance mode
- GitHub and GHCR update settings

## Local development

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

Minimum useful local values:

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

## Updating the server

After new code is pushed to `main`, update the server with:

```bash
cd ~/crypto-intel-papertrade
sh scripts/update.sh
```

`update.sh` now does the following:

- pulls the latest `main`
- sets `IMAGE_TAG` to the latest commit SHA
- retries GHCR image pulls before falling back to a local Docker build
- keeps the embedded PostgreSQL password aligned with `.env`
- runs Prisma migrations or `db push`
- restarts services
- performs a health check
- rolls back to the previous image tag if the update fails

## Main routes

- `/`: overview dashboard
- `/auth`: dedicated registration and login page
- `/market`: market intelligence
- `/paper-trading`: paper trading workspace
- `/ai-settings`: user AI settings
- `/alerts`: alerts and feed stream
- `/admin`: hidden admin console entry

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
sh scripts/install.sh
sh scripts/update.sh
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

If `SMTP_*` is empty, development mode falls back to preview mode and logs the code instead of sending a real email.

## Important notes

- never commit real secrets to GitHub
- keep real secrets only in `.env` and encrypted admin-side storage
- the worker already has the main loops wired, but production hardening is still needed for retries, batching, rate limits, and exchange-specific edge cases

## References

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)
