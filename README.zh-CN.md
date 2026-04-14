# Crypto Intel Papertrade

[English README](./README.md)

这是一个基于 `Next.js + TypeScript` 的虚拟货币消息面与虚拟仓平台，当前版本重点包括：

- 接入 Binance 和 OKX 官方行情接口
- 聚合交易所公告与 RSS / 新闻源
- 邮箱验证码注册、登录、忘记密码重置
- 现货 / 永续虚拟仓
- 每个用户独立的 AI `baseUrl + apiKey + model` 配置
- 管理员后台与脚本化更新

## 当前版本的主要变化

- 认证页拆成独立页面：
  - `/auth/login`
  - `/auth/register`
  - `/auth/forgot-password`
- `/auth` 现在只负责跳转到 `/auth/login`
- 公开导航只显示 `登录` 和 `注册`
- 管理员入口不在公开导航显示，只能手动访问 `/admin`
- 首页和消息中心默认优先展示消息面，不再默认刷大量 `market_tick`
- 新增管理员一键重置命令

## 运行服务

- `web`：前台、后台、API、SSE
- `worker`：行情采集、消息聚合、AI 执行、虚拟仓仿真
- `postgres`：数据库
- `redis`：实时事件总线

## Ubuntu 一键快速部署

全新 Ubuntu 服务器可以直接执行：

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

这个脚本会自动：

- 安装缺失依赖
- 克隆仓库
- 创建 `.env`
- 生成 `AUTH_SECRET`
- 生成 `APP_ENCRYPTION_KEY`
- 初始化数据库
- 执行管理员重置
- 启动 `web`、`worker`、`postgres`、`redis`

默认安装目录：

```text
$HOME/crypto-intel-papertrade
```

## Ubuntu 手动部署

### 1. 安装 Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

### 2. 安装 Docker Engine 和 Docker Compose 插件

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
```

如果你希望当前用户不带 `sudo` 使用 Docker：

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

### 3. 克隆项目

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
git config core.fileMode false
```

### 4. 执行安装脚本

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/install.sh
```

`install.sh` 现在会自动：

- 没有 `.env` 时从 `.env.example` 创建
- 自动生成 `AUTH_SECRET`
- 自动生成 `APP_ENCRYPTION_KEY`
- 自动写入 GitHub / GHCR 默认值
- 启动 PostgreSQL 和 Redis
- 优先重试拉取 GHCR 镜像，失败时回退本地构建
- 有迁移时执行 `prisma migrate deploy`
- 没有迁移文件时自动回退 `prisma db push`
- 执行系统 seed
- 执行 `npm run admin:reset` 强制初始化管理员账号
- 启动 `web` 和 `worker`
- 为所有服务写入 `restart: unless-stopped`，保证服务器重启后自动拉起

## 服务器更新

每次你把新代码推到 `main` 后，在服务器执行：

```bash
cd ~/crypto-intel-papertrade
sh scripts/update.sh
```

`update.sh` 当前会：

- 拉取最新 `main`
- 更新 `IMAGE_TAG`
- 优先拉取 GHCR 镜像，失败时回退本地构建
- 自动同步 `.env` 中的 PostgreSQL 密码
- 执行 Prisma 迁移或 `db push`
- 重启服务
- 保持服务在宿主机重启后自动恢复
- 检查 `/api/health`
- 失败时自动回滚

## 重置管理员账号

如果管理员邮箱或密码不对，直接在服务器执行：

```bash
cd ~/crypto-intel-papertrade
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/reset-admin.sh
```

这个命令会：

- 更新 `.env` 里的管理员邮箱和密码
- 确保目标用户角色为 `ADMIN`
- 标记邮箱已验证
- 保证该管理员拥有主虚拟仓

## 本地开发

### 1. 克隆并准备 `.env`

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
cp .env.example .env
```

最低建议值：

```env
AUTH_SECRET=local-dev-secret
APP_ENCRYPTION_KEY=local-dev-encryption-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 2. 启动基础服务

```bash
docker compose up -d postgres redis
```

### 3. 安装依赖并初始化

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run admin:reset
```

### 4. 启动前端

```bash
npm run dev
```

另一个终端启动 worker：

```bash
npm run worker
```

## 主要页面

- `/`
- `/market`
- `/market/[instrument]`
- `/alerts`
- `/paper-trading`
- `/ai-settings`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/admin`

## 常用命令

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
npm run admin:reset
sh scripts/install.sh
sh scripts/update.sh
sh scripts/reset-admin.sh
```

## 参考链接

- [Binance Spot REST 行情接口](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints)
- [Binance WebSocket Streams](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams)
- [OKX API v5 文档](https://my.okx.com/docs-v5/en/)
- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
