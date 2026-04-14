#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$HOME/crypto-intel-papertrade}"
GITHUB_OWNER="${GITHUB_OWNER:-weige0831}"
GITHUB_REPO="${GITHUB_REPO:-crypto-intel-papertrade}"
BRANCH="${BRANCH:-main}"

log() {
  printf '%s\n' "$1"
}

sudo_cmd() {
  if command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    "$@"
  fi
}

install_git() {
  if command -v git >/dev/null 2>&1; then
    return
  fi

  log "Installing git..."
  sudo_cmd apt update
  sudo_cmd apt install -y git
}

install_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return
  fi

  log "Installing docker engine and docker compose plugin..."
  sudo_cmd apt update
  sudo_cmd apt install -y ca-certificates curl
  sudo_cmd install -m 0755 -d /etc/apt/keyrings
  sudo_cmd curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo_cmd chmod a+r /etc/apt/keyrings/docker.asc
  ARCH="$(dpkg --print-architecture)"
  CODENAME="$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")"
  printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$CODENAME" "$ARCH" | sudo_cmd tee /etc/apt/sources.list.d/docker.sources >/dev/null
  sudo_cmd apt update
  sudo_cmd apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo_cmd systemctl enable --now docker
  getent group docker >/dev/null 2>&1 || sudo_cmd groupadd docker
  sudo_cmd usermod -aG docker "$USER" || true
}

clone_or_update_repo() {
  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" "$APP_DIR"
  else
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
  fi
}

main() {
  if [ ! -f /etc/os-release ]; then
    log "This quickstart script currently targets Ubuntu-like Linux systems."
    exit 1
  fi

  install_git
  install_docker
  clone_or_update_repo

  cd "$APP_DIR"
  chmod +x scripts/install.sh scripts/update.sh scripts/quickstart-ubuntu.sh

  if ! docker info >/dev/null 2>&1; then
    log "Docker was installed or docker group permissions changed."
    log "If install fails due to Docker permissions, log out and log back in, then re-run this script."
  fi

  APP_DIR="$APP_DIR" \
  GITHUB_OWNER="$GITHUB_OWNER" \
  GITHUB_REPO="$GITHUB_REPO" \
  BRANCH="$BRANCH" \
  ADMIN_EMAIL="${ADMIN_EMAIL:-}" \
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
  sh scripts/install.sh
}

main "$@"
