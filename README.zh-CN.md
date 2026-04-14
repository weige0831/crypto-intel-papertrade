# Crypto Intel Papertrade

[English README](./README.md)

这是一个基于 `Next.js + TypeScript` 的全栈加密货币情报与虚拟仓平台。

这份文档主要写给两类人：

- 只想把项目部署到 Linux 服务器上的使用者
- 想在本地开发、修改和扩展项目的开发者

## 项目功能

- 监听 Binance 和 OKX 实时市场数据
- 聚合交易所公告与 RSS / 新闻源
- 支持邮箱验证码注册和密码登录
- 支持现货与永续合约虚拟仓
- 每个用户都可以配置兼容 OpenAI 风格接口的 `baseUrl + apiKey + model`
- 提供管理员后台，用于配置 SMTP、AI 默认参数、数据源和系统更新
- 提供 Linux 安装脚本与更新脚本

## 服务组成

- `web`：前台、用户页面、管理员页面和 API
- `worker`：行情采集、消息聚合、AI 执行、资金费与强平循环
- `postgres`：业务数据库
- `redis`：SSE 和 worker 之间的实时事件总线

## 当前界面逻辑

- 普通用户通过页面右上角的 `登录 / 注册` 入口进入认证页
- 注册和登录都在独立的 `/auth` 页面中完成
- 管理员入口默认不在公开导航中显示
- 管理员通过手动访问 `/admin` 进入后台；未登录时会自动跳到管理员登录流程

## Ubuntu 最快启动方式

如果你只想最快部署，在一台全新的 Ubuntu 服务器上执行：

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

这个脚本会自动：

- 安装缺失的系统依赖
- 克隆项目代码
- 创建 `.env`
- 生成 `AUTH_SECRET`
- 生成 `APP_ENCRYPTION_KEY`
- 启动 PostgreSQL、Redis、web 和 worker

默认安装目录：

```text
$HOME/crypto-intel-papertrade
```

安装完成后访问：

```text
http://你的服务器IP:3000
```

## Ubuntu 详细部署步骤

### 第 1 步：登录服务器

```bash
ssh your-user@your-server-ip
```

### 第 2 步：安装 Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

### 第 3 步：安装 Docker Engine 和 Docker Compose 插件

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

### 第 4 步：可选，允许当前用户不带 sudo 运行 Docker

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

如果 `newgrp docker` 没生效，就退出 SSH 重新登录一次。

### 第 5 步：克隆项目

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
git config core.fileMode false
```

### 第 6 步：执行安装脚本

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' sh scripts/install.sh
```

现在的 `install.sh` 会自动完成这些事情：

- 如果没有 `.env`，自动从 `.env.example` 创建
- 自动生成 `AUTH_SECRET`
- 自动生成 `APP_ENCRYPTION_KEY`
- 自动写入 GitHub 和 GHCR 默认值
- 启动 PostgreSQL 和 Redis
- 在 GHCR 镜像暂时未就绪时重试拉取，再回退到本地 Docker 构建
- 自动把内置 PostgreSQL 密码和 `.env` 里的 `DATABASE_URL` 对齐
- 如果存在 `prisma/migrations`，执行 `prisma migrate deploy`
- 如果暂时还没有迁移文件，自动回退到 `prisma db push`
- 执行 seed 并启动 `web` 和 `worker`

### 第 7 步：安装完成后进入后台继续配置

第一次安装完成后，使用管理员账户登录，再到后台配置：

- SMTP 参数
- AI 默认参数
- 数据源参数
- 维护模式
- GitHub / GHCR 更新参数

## 本地开发

### 依赖要求

- `Node.js 22`
- `npm`
- `Docker`
- `Docker Compose`
- `Git`

### 第 1 步：克隆代码

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### 第 2 步：创建 `.env`

```bash
cp .env.example .env
```

本地开发至少建议改这几个值：

```env
AUTH_SECRET=local-dev-secret
APP_ENCRYPTION_KEY=local-dev-encryption-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 第 3 步：启动 PostgreSQL 和 Redis

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

### 第 8 步：打开本地站点

```text
http://localhost:3000
```

## 服务器更新方式

每次新代码推到 `main` 后，在服务器执行：

```bash
cd ~/crypto-intel-papertrade
sh scripts/update.sh
```

现在的 `update.sh` 会自动执行：

- 拉取最新 `main`
- 把 `IMAGE_TAG` 切到最新提交 SHA
- 优先重试拉取 GHCR 镜像，失败后再回退到本地 Docker 构建
- 自动把内置 PostgreSQL 密码和 `.env` 保持一致
- 执行 Prisma 迁移或 `db push`
- 重启服务
- 做健康检查
- 如果失败，自动回滚到上一个镜像标签

## 主要页面

- `/`：总览首页
- `/auth`：独立注册 / 登录页
- `/market`：市场情报
- `/paper-trading`：虚拟仓工作台
- `/ai-settings`：用户 AI 配置
- `/alerts`：提醒中心
- `/admin`：隐藏的管理员入口

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
sh scripts/install.sh
sh scripts/update.sh
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

### `port 3000 is already in use`

查看是谁占用了 3000：

```bash
sudo ss -ltnp | grep 3000
```

### 邮箱验证码收不到

如果 `SMTP_*` 没配置，开发模式会退回预览模式，只在日志中输出验证码，不会真实发邮件。

## 重要提醒

- 不要把真实密钥提交到 GitHub
- 所有真实密钥都只应该放在 `.env` 和后台加密存储中
- 当前 worker 已经具备核心骨架，但如果要长期线上运行，还需要继续加强重试、限频、批处理和交易所兼容细节

## 参考文档

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)
