# Crypto Intel Papertrade

[English README](./README.md)

这是一个基于 `Next.js + TypeScript` 的全栈项目，目标是把下面这些能力放在同一个平台里：

- 实时监听 `Binance` 和 `OKX` 行情
- 聚合交易所公告、RSS 和第三方消息源
- 邮箱验证码注册登录
- 现货与永续合约虚拟仓
- 用户自行配置 `OpenAI 兼容` 的 `baseUrl + apiKey + model`
- 管理员后台统一配置 SMTP、AI 默认参数、数据源、GitHub 和更新参数
- 通过 `install.sh` 和 `update.sh` 在 Linux 服务器上安装和更新

## 这个项目适合谁看

这份文档尽量按两类人写：

- 只想把项目部署起来的人
- 想参与开发、修改代码的人

## 项目由哪些服务组成

- `web`
  前台、后台和 API
- `worker`
  行情接入、消息抓取、AI 执行、资金费和强平循环
- `postgres`
  业务数据库
- `redis`
  实时事件总线，给 SSE 和 worker 用

## 先选你的使用方式

你可以直接按下面两条路线中的一条来做：

1. `我只想部署到服务器上`
2. `我想在本地开发`

## 路线一：部署到 Ubuntu 服务器

下面命令按 `Ubuntu 22.04 / 24.04` 写。
如果你是 Debian 系，也基本类似。
如果你是 CentOS / RHEL / Fedora，请根据系统调整包管理器，并参考文末的 Docker 官方文档。

### 第 1 步：登录服务器

```bash
ssh 你的用户名@你的服务器IP
```

### 第 2 步：安装 Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

### 第 3 步：安装 Docker 和 Docker Compose

这一段命令按 Docker 官方 Ubuntu 安装文档整理。

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

如果最后 `hello-world` 正常输出，说明 Docker 已经安装成功。

### 第 4 步：可选，配置当前用户不用 sudo 也能运行 docker

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

如果 `newgrp docker` 后仍然不生效，退出当前 SSH 再重新登录一次。

### 第 5 步：下载项目代码

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### 第 6 步：创建环境变量文件

```bash
cp .env.example .env
```

### 第 7 步：生成密钥

执行两次下面的命令，记下输出结果：

```bash
openssl rand -hex 32
openssl rand -hex 32
```

第一个值填到 `AUTH_SECRET`
第二个值填到 `APP_ENCRYPTION_KEY`

### 第 8 步：编辑 `.env`

打开配置文件：

```bash
nano .env
```

至少修改这些配置：

```env
AUTH_SECRET=替换成你生成的随机密钥
APP_ENCRYPTION_KEY=替换成你生成的随机密钥
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=替换成强密码
GITHUB_OWNER=weige0831
GITHUB_REPO=crypto-intel-papertrade
GHCR_IMAGE=ghcr.io/weige0831/crypto-intel-papertrade
```

如果你要启用 AI 自动开仓，还要配置：

```env
OPENAI_COMPAT_BASE_URL=https://api.openai.com/v1
OPENAI_COMPAT_API_KEY=你的真实API Key
OPENAI_COMPAT_MODEL=gpt-4.1-mini
```

如果你要真实发送邮箱验证码，还要配置：

```env
SMTP_HOST=你的SMTP地址
SMTP_PORT=587
SMTP_USER=你的SMTP用户名
SMTP_PASSWORD=你的SMTP密码
SMTP_FROM_EMAIL=你的发件邮箱
SMTP_FROM_NAME=Crypto Intel
```

在 `nano` 里保存退出：

- `Ctrl+O`
- 回车
- `Ctrl+X`

### 第 9 步：给脚本加执行权限

```bash
chmod +x scripts/install.sh scripts/update.sh
```

### 第 10 步：执行首次安装

```bash
GITHUB_OWNER=weige0831 ./scripts/install.sh
```

这个脚本会自动做下面这些事情：

- 拉取仓库最新内容
- 启动 PostgreSQL 和 Redis
- 执行 Prisma 数据库步骤
- 初始化管理员相关数据
- 启动 `web` 和 `worker`

### 第 11 步：打开网站

浏览器访问：

```text
http://你的服务器IP:3000
```

管理员登录信息：

- 邮箱：`.env` 里的 `ADMIN_EMAIL`
- 密码：`.env` 里的 `ADMIN_PASSWORD`

### 第 12 步：以后如何更新

以后你每次确认代码没问题并推送到 `main` 后，可以用两种方式更新服务器：

- 在管理员后台点击一键更新
- 在服务器里直接执行下面命令

```bash
./scripts/update.sh
```

## 路线二：本地开发

如果你是开发者，想在本地启动项目并改代码，按下面做。

### 本地需要什么

- `Node.js 22`
- `npm`
- `Docker`
- `Docker Compose`
- `Git`

### 第 1 步：拉取代码

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### 第 2 步：创建本地 `.env`

```bash
cp .env.example .env
```

本地开发时，至少改这几个值：

```env
AUTH_SECRET=local-dev-secret
APP_ENCRYPTION_KEY=local-dev-encryption-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 第 3 步：启动数据库和 Redis

```bash
docker compose up -d postgres redis
```

### 第 4 步：安装依赖

```bash
npm install
```

### 第 5 步：初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 第 6 步：启动前端

```bash
npm run dev
```

### 第 7 步：在另一个终端启动 worker

```bash
npm run worker
```

### 第 8 步：打开本地网站

```text
http://localhost:3000
```

## 主要页面

- `/`
  总览页
- `/auth`
  注册和登录
- `/market`
  市场情报
- `/paper-trading`
  虚拟仓和手动下单
- `/ai-settings`
  用户 AI 配置
- `/alerts`
  预警和消息流
- `/admin`
  管理后台

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
docker compose up -d postgres redis
docker compose down
```

## 常见问题

### `docker: command not found`

说明 Docker 没装好，或者当前 shell 还没刷新。

### `permission denied while trying to connect to the Docker daemon socket`

执行：

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

### `3000 端口被占用`

查看是谁占用了 3000：

```bash
sudo ss -ltnp | grep 3000
```

然后停掉冲突进程，或者改 `docker-compose.yml` 的端口映射。

### 邮箱验证码收不到

如果 `SMTP_*` 没配，开发环境会走预览模式，也就是只在日志里输出验证码，不会真正发邮件。

## 重要提醒

- 不要把真实密钥提交到 GitHub
- 所有真实配置都应该只放在 `.env` 和后台加密存储里
- 现在的 worker 已经具备核心骨架，但如果你后面要长期线上跑，还应该继续加强限频、重试、批处理和交易所兼容细节

## 参考文档

这份 README 里的 Docker 安装命令参考了 Docker 官方文档：

- [Docker Engine Ubuntu 安装文档](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux 安装后配置文档](https://docs.docker.com/engine/install/linux-postinstall/)
