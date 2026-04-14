# Crypto Intel Papertrade

[中文文档](./README.zh-CN.md)

This project is a full-stack crypto intelligence and paper trading platform built with `Next.js + TypeScript`.

It is designed for two kinds of readers:

- someone who just wants to deploy it on a Linux server
- another developer who wants to run and modify it locally

## What this project does

- listens to Binance and OKX market data
- aggregates exchange announcements and RSS/news feeds
- supports email verification registration and password login
- supports spot and perpetual paper trading
- lets each user configure an OpenAI-compatible `baseUrl + apiKey + model`
- provides an admin panel for SMTP, AI defaults, data source settings, and system updates
- ships with `install.sh` and `update.sh` for Linux deployment

## Service layout

- `web`
  Next.js frontend, admin console, and API routes
- `worker`
  market ingestion, intel collection, AI execution, funding, and liquidation loops
- `postgres`
  application database
- `redis`
  realtime event bus for SSE and worker communication

## Start here

Choose one path:

1. `I only want to deploy it on a server`
2. `I want to develop it locally`

## Path 1: Deploy on Ubuntu server

These commands are written for `Ubuntu 22.04/24.04`.
If your server is Debian-based, they are very similar.
If your server is CentOS/RHEL/Fedora, adjust the package manager and use the official Docker docs for that distro.

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

These commands are based on the official Docker Ubuntu installation guide.

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

### Step 4: Optional, allow running docker without sudo

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

If `newgrp docker` does not take effect, log out and SSH in again.

### Step 5: Clone the project

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### Step 6: Create the environment file

```bash
cp .env.example .env
```

### Step 7: Generate secrets

Run these commands and keep the generated values:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Use the first value for `AUTH_SECRET`.
Use the second value for `APP_ENCRYPTION_KEY`.

### Step 8: Edit `.env`

Open the file:

```bash
nano .env
```

At minimum, set these values:

```env
AUTH_SECRET=replace-with-random-secret
APP_ENCRYPTION_KEY=replace-with-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
GITHUB_OWNER=weige0831
GITHUB_REPO=crypto-intel-papertrade
GHCR_IMAGE=ghcr.io/weige0831/crypto-intel-papertrade
```

If you want AI auto-execution, also set:

```env
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_API_KEY=your-real-api-key
OPENAI_COMPAT_MODEL=gpt-4.1-mini
```

If you want real email verification delivery, also set:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=your@email.com
SMTP_FROM_NAME=Crypto Intel
```

Save and exit in `nano`:

- `Ctrl+O`
- `Enter`
- `Ctrl+X`

### Step 9: Make scripts executable

```bash
chmod +x scripts/install.sh scripts/update.sh
```

### Step 10: Run the first installation

```bash
GITHUB_OWNER=weige0831 ./scripts/install.sh
```

What this script does:

- pulls the latest repository state
- starts PostgreSQL and Redis
- runs Prisma migration/deploy steps
- seeds the initial admin config
- starts `web` and `worker`

### Step 11: Open the site

Open in your browser:

```text
http://your-server-ip:3000
```

Login with:

- email: the value of `ADMIN_EMAIL`
- password: the value of `ADMIN_PASSWORD`

### Step 12: Update later

After you push new code to `main`, update the server with either:

- the admin panel update button
- or the server command below

```bash
./scripts/update.sh
```

## Path 2: Local development

If you are another developer and want to work on the code locally, this is the simplest path.

### Local requirements

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

For local development, you can keep most defaults and only change:

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

### Step 4: Install npm dependencies

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

### Step 8: Open the local site

```text
http://localhost:3000
```

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

Then stop the conflicting process or change the published port in `docker-compose.yml`.

### Email codes are not arriving

If `SMTP_*` is empty, the project falls back to preview mode in development and logs the code instead of sending real email.

## Important notes

- never commit real secrets to GitHub
- keep real values only in `.env` and admin-side encrypted storage
- the worker already has the core loops wired, but production hardening is still needed for rate limits, retries, batching, and exchange edge cases

## References

Docker install commands in this README were aligned with the official Docker docs for Ubuntu and Linux post-install steps:

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)
