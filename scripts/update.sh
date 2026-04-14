#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEFAULT_APP_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
BRANCH="${BRANCH:-main}"

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo docker "$@"
    return
  fi

  echo "Docker is installed but current user cannot access it."
  exit 1
}

compose() {
  docker_cmd compose "$@"
}

has_prisma_migrations() {
  [ -d prisma/migrations ] || return 1
  find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q .
}

set_env_value() {
  key="$1"
  value="$2"
  escaped_value="$(printf '%s' "$value" | sed 's/[\/&]/\\&/g')"

  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s/^${key}=.*/${key}=${escaped_value}/" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

apply_database_changes() {
  if has_prisma_migrations; then
    echo "Applying Prisma migrations..."
    compose run --rm web npm run db:migrate
    return
  fi

  echo "No Prisma migrations found. Using prisma db push..."
  compose run --rm web npm run db:push
}

cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "Repository not initialized"
  exit 1
fi

PREVIOUS_TAG="$(grep '^IMAGE_TAG=' .env 2>/dev/null | cut -d '=' -f2- || true)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
NEXT_TAG="$(git rev-parse "origin/${BRANCH}")"

if [ -z "$NEXT_TAG" ]; then
  echo "Unable to resolve target image tag"
  exit 1
fi

set_env_value IMAGE_TAG "$NEXT_TAG"

rollback() {
  echo "Health check failed, rolling back"
  if [ -n "$PREVIOUS_TAG" ]; then
    set_env_value IMAGE_TAG "$PREVIOUS_TAG"
    compose pull web worker || true
    compose up -d web worker
  fi
}

trap rollback INT TERM HUP

if ! compose pull web worker; then
  echo "Unable to pull GHCR images, trying local build"
  compose build web worker
fi

compose up -d postgres redis
apply_database_changes
compose up -d --remove-orphans web worker

sleep 12

if ! curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  rollback
  exit 1
fi

echo "Update succeeded: ${NEXT_TAG}"
