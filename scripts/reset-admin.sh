#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEFAULT_APP_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

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

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo ".env is missing"
  exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
  ADMIN_EMAIL="$(get_env_value ADMIN_EMAIL)"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$(get_env_value ADMIN_PASSWORD)"
fi

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "ADMIN_EMAIL and ADMIN_PASSWORD are required"
  exit 1
fi

set_env_value ADMIN_EMAIL "$ADMIN_EMAIL"
set_env_value ADMIN_PASSWORD "$ADMIN_PASSWORD"

compose up -d postgres redis
compose run --rm web npm run admin:reset

echo "Admin credentials reset: ${ADMIN_EMAIL}"
