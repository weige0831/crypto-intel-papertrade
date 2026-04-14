#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEFAULT_APP_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
BRANCH="${BRANCH:-main}"
IMAGE_PULL_RETRIES="${IMAGE_PULL_RETRIES:-6}"
IMAGE_PULL_DELAY="${IMAGE_PULL_DELAY:-10}"

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

get_env_value() {
  key="$1"
  grep "^${key}=" .env 2>/dev/null | head -n 1 | cut -d '=' -f2-
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

ensure_env_file() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      return
    fi

    echo ".env is missing and .env.example was not found."
    exit 1
  fi
}

sync_embedded_postgres_credentials() {
  database_url="$(get_env_value DATABASE_URL)"
  [ -n "$database_url" ] || return 0

  db_user="$(printf '%s' "$database_url" | sed -n 's#^[^:]*://\([^:/?]*\):.*#\1#p')"
  db_password="$(printf '%s' "$database_url" | sed -n 's#^[^:]*://[^:/?]*:\([^@]*\)@.*#\1#p')"
  db_host="$(printf '%s' "$database_url" | sed -n 's#^[^@]*@\([^:/?]*\).*#\1#p')"

  [ "$db_host" = "postgres" ] || return 0
  [ "$db_user" = "postgres" ] || return 0
  [ -n "$db_password" ] || return 0

  escaped_password="$(printf '%s' "$db_password" | sed "s/'/''/g")"
  compose exec -T postgres psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '${escaped_password}';" >/dev/null 2>&1 || true
}

apply_database_changes() {
  sync_embedded_postgres_credentials

  if has_prisma_migrations; then
    echo "Applying Prisma migrations..."
    compose run --rm web npm run db:migrate
    return
  fi

  echo "No Prisma migrations found. Using prisma db push..."
  compose run --rm web npm run db:push
}

pull_images_with_retry() {
  attempt=1

  while [ "$attempt" -le "$IMAGE_PULL_RETRIES" ]; do
    if compose pull web worker; then
      return 0
    fi

    if [ "$attempt" -lt "$IMAGE_PULL_RETRIES" ]; then
      echo "Images not ready yet. Retrying in ${IMAGE_PULL_DELAY}s (${attempt}/${IMAGE_PULL_RETRIES})..."
      sleep "$IMAGE_PULL_DELAY"
    fi

    attempt=$((attempt + 1))
  done

  return 1
}

rollback() {
  echo "Update failed, rolling back"

  if [ -n "$PREVIOUS_TAG" ]; then
    set_env_value IMAGE_TAG "$PREVIOUS_TAG"
    compose pull web worker || true
    compose up -d web worker || true
  fi
}

cd "$APP_DIR"
ensure_env_file

if [ ! -d .git ]; then
  echo "Repository not initialized"
  exit 1
fi

PREVIOUS_TAG="$(get_env_value IMAGE_TAG)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
NEXT_TAG="$(git rev-parse "origin/${BRANCH}")"

if [ -z "$NEXT_TAG" ]; then
  echo "Unable to resolve target image tag"
  exit 1
fi

set_env_value IMAGE_TAG "$NEXT_TAG"

if ! pull_images_with_retry; then
  echo "Unable to pull GHCR images after retries, trying local build"
  if ! compose build web worker; then
    rollback
    exit 1
  fi
fi

compose up -d postgres redis

if ! apply_database_changes; then
  rollback
  exit 1
fi

if ! compose up -d --remove-orphans web worker; then
  rollback
  exit 1
fi

sleep 12

if ! curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  rollback
  exit 1
fi

echo "Update succeeded: ${NEXT_TAG}"
