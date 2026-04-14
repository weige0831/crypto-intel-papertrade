#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEFAULT_APP_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
GITHUB_OWNER="${GITHUB_OWNER:-weige0831}"
GITHUB_REPO="${GITHUB_REPO:-crypto-intel-papertrade}"
GHCR_IMAGE="${GHCR_IMAGE:-ghcr.io/${GITHUB_OWNER}/${GITHUB_REPO}}"
BRANCH="${BRANCH:-main}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

log() {
  printf '%s\n' "$1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    printf '%s\n' "$1 is required"
    exit 1
  }
}

docker_cmd() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo docker "$@"
    return
  fi

  log "Docker is installed but current user cannot access it."
  log "Either add the user to the docker group or run this script with a user that can execute docker."
  exit 1
}

compose() {
  docker_cmd compose "$@"
}

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
    return
  fi

  od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

escape_sed() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

set_env_value() {
  key="$1"
  value="$2"
  escaped_value="$(escape_sed "$value")"

  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s/^${key}=.*/${key}=${escaped_value}/" .env
  else
    printf '\n%s=%s\n' "$key" "$value" >> .env
  fi
}

get_env_value() {
  key="$1"
  grep "^${key}=" .env 2>/dev/null | head -n 1 | cut -d '=' -f2-
}

prompt_value() {
  prompt_label="$1"
  current_value="$2"

  if [ -n "$current_value" ]; then
    printf '%s' "$current_value"
    return
  fi

  printf '%s' "$prompt_label"
  read -r value
  printf '%s' "$value"
}

prompt_secret() {
  prompt_label="$1"
  current_value="$2"

  if [ -n "$current_value" ]; then
    printf '%s' "$current_value"
    return
  fi

  printf '%s' "$prompt_label"
  stty -echo
  read -r value
  stty echo
  printf '\n' >&2
  printf '%s' "$value"
}

detect_app_url() {
  current_value="$1"

  if [ -n "$current_value" ] && [ "$current_value" != "http://localhost:3000" ]; then
    printf '%s' "$current_value"
    return
  fi

  if command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    if [ -n "${ip:-}" ]; then
      printf 'http://%s:3000' "$ip"
      return
    fi
  fi

  printf '%s' "http://localhost:3000"
}

bootstrap_env_file() {
  if [ ! -f .env ]; then
    cp .env.example .env
  fi

  current_auth_secret="$(get_env_value AUTH_SECRET)"
  current_encrypt_key="$(get_env_value APP_ENCRYPTION_KEY)"
  current_admin_email="$(get_env_value ADMIN_EMAIL)"
  current_admin_password="$(get_env_value ADMIN_PASSWORD)"
  current_app_url="$(get_env_value APP_URL)"

  if [ -z "$current_auth_secret" ] || [ "$current_auth_secret" = "replace-me-with-a-random-long-secret" ]; then
    set_env_value AUTH_SECRET "$(generate_secret)"
  fi

  if [ -z "$current_encrypt_key" ] || [ "$current_encrypt_key" = "replace-me-with-a-random-long-secret" ]; then
    set_env_value APP_ENCRYPTION_KEY "$(generate_secret)"
  fi

  if [ "$current_admin_email" = "admin@example.com" ]; then
    current_admin_email=""
  fi

  if [ "$current_admin_password" = "replace-me" ]; then
    current_admin_password=""
  fi

  final_admin_email="$(prompt_value 'Admin email: ' "${ADMIN_EMAIL:-$current_admin_email}")"
  final_admin_password="$(prompt_secret 'Admin password: ' "${ADMIN_PASSWORD:-$current_admin_password}")"

  if [ -z "$final_admin_email" ] || [ -z "$final_admin_password" ]; then
    log "Admin email and admin password are required."
    exit 1
  fi

  set_env_value ADMIN_EMAIL "$final_admin_email"
  set_env_value ADMIN_PASSWORD "$final_admin_password"
  set_env_value GITHUB_OWNER "$GITHUB_OWNER"
  set_env_value GITHUB_REPO "$GITHUB_REPO"
  set_env_value GHCR_IMAGE "$GHCR_IMAGE"
  set_env_value UPDATE_CHANNEL "$BRANCH"
  set_env_value IMAGE_TAG "$(git rev-parse "origin/${BRANCH}")"
  set_env_value UPDATE_SCRIPT_PATH "./scripts/update.sh"
  set_env_value ALLOW_SYSTEM_UPDATE "true"
  set_env_value APP_URL "$(detect_app_url "$current_app_url")"
}

ensure_repo() {
  mkdir -p "$APP_DIR"

  if [ ! -d "$APP_DIR/.git" ]; then
    require_cmd git
    git clone "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" "$APP_DIR"
  fi

  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
}

ensure_compose_images() {
  if ! compose pull web worker; then
    log "Unable to pull prebuilt images from GHCR, falling back to local build."
    compose build web worker
  fi
}

main() {
  require_cmd git
  require_cmd sed
  require_cmd awk

  if ! docker_cmd compose version >/dev/null 2>&1; then
    log "docker compose is required"
    exit 1
  fi

  ensure_repo
  bootstrap_env_file
  ensure_compose_images

  compose up -d postgres redis
  compose run --rm web npm run db:migrate
  compose run --rm web npm run db:seed
  compose up -d web worker

  log "Install finished."
  log "Open: $(get_env_value APP_URL)"
  log "Admin email: $(get_env_value ADMIN_EMAIL)"
  log "You can configure SMTP, AI, and other settings later in the admin panel."
}

main "$@"
