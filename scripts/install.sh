#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/crypto-intel-papertrade}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
GITHUB_REPO="${GITHUB_REPO:-crypto-intel-papertrade}"
BRANCH="${BRANCH:-main}"

if [ -z "$GITHUB_OWNER" ]; then
  echo "GITHUB_OWNER is required"
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "docker is required"
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "docker compose is required"
  exit 1
}

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

if [ ! -f .env ]; then
  cp .env.example .env
fi

LATEST_TAG="$(git rev-parse origin/${BRANCH})"

if ! grep -q '^IMAGE_TAG=' .env; then
  printf '\nIMAGE_TAG=%s\n' "$LATEST_TAG" >> .env
else
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${LATEST_TAG}/" .env
fi

docker compose pull web worker || true
docker compose up -d postgres redis
docker compose run --rm web npm run db:migrate
docker compose run --rm web npm run db:seed
docker compose up -d web worker

echo "Install finished. Review .env and open http://localhost:3000"
