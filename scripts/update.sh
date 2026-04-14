#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$(pwd)}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "Repository not initialized"
  exit 1
fi

PREVIOUS_TAG="$(grep '^IMAGE_TAG=' .env 2>/dev/null | cut -d '=' -f2- || true)"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
NEXT_TAG="$(git rev-parse origin/${BRANCH})"

if [ -z "$NEXT_TAG" ]; then
  echo "Unable to resolve target image tag"
  exit 1
fi

if ! grep -q '^IMAGE_TAG=' .env; then
  printf '\nIMAGE_TAG=%s\n' "$NEXT_TAG" >> .env
else
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${NEXT_TAG}/" .env
fi

rollback() {
  echo "Health check failed, rolling back"
  if [ -n "$PREVIOUS_TAG" ]; then
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${PREVIOUS_TAG}/" .env
    docker compose pull web worker || true
    docker compose up -d web worker
  fi
}

trap rollback INT TERM HUP

docker compose pull web worker || true
docker compose up -d postgres redis
docker compose run --rm web npm run db:migrate
docker compose up -d --remove-orphans web worker

sleep 12

if ! curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  rollback
  exit 1
fi

echo "Update succeeded: ${NEXT_TAG}"
