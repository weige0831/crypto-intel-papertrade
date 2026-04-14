# Crypto Intel Papertrade

[English README](./README.md)

这是一个基于 `Next.js + TypeScript` 的全栈虚拟币情报与虚拟仓平台。

它主要提供这些能力：

- 监听 Binance 和 OKX 实时行情
- 聚合交易所公告和 RSS / 新闻源
- 邮箱验证码注册登录
- 现货和永续合约虚拟仓
- 用户自行配置 OpenAI 兼容接口做 AI 自动开仓
- 管理员后台统一管理 SMTP、AI、数据源、GitHub 和更新设置
- 通过安装脚本和更新脚本部署到 Linux 服务器

## 这份文档是写给谁的

我按两类人来写：

- 只想把项目尽快部署起来的人
- 想在本地开发和修改代码的人

## 项目由哪些服务组成

- `web`
  前台、后台和 API
- `worker`
  负责行情接入、消息抓取、AI 执行、资金费和强平循环
- `postgres`
  业务数据库
- `redis`
  实时事件总线，给 SSE 和 worker 用

## 最快启动方式

如果你只想最快把项目跑起来，请直接使用一键快速启动脚本。

现在的脚本行为已经改成：

- 自动创建 `.env`
- 自动生成 `AUTH_SECRET`
- 自动生成 `APP_ENCRYPTION_KEY`
- 自动填充 GitHub / GHCR 默认值
- 除了管理员邮箱和密码以外，其他内容都可以安装后再去管理员后台配置

也就是说，首次安装你只需要准备两个值：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Ubuntu 一键快速开始

在一台全新的 Ubuntu 服务器上执行：

```bash
curl -fsSL https://raw.githubusercontent.com/weige0831/crypto-intel-papertrade/main/scripts/quickstart-ubuntu.sh -o quickstart-ubuntu.sh
chmod +x quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./quickstart-ubuntu.sh
```

默认安装目录是：

```text
$HOME/crypto-intel-papertrade
```

安装完成后访问：

```text
http://你的服务器IP:3000
```

登录信息就是你刚才提供的：

- 邮箱：`ADMIN_EMAIL`
- 密码：`ADMIN_PASSWORD`

## Ubuntu 详细部署步骤

如果你不想直接跑一键脚本，而是希望看到每一步都做了什么，可以按下面的详细步骤来。

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

下面这些命令按 Docker 官方 Ubuntu 安装文档整理：

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

如果最后 `hello-world` 正常输出，说明 Docker 安装成功。

### 第 4 步：可选，让当前用户不用 sudo 也能运行 docker

```bash
getent group docker || sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

如果 `newgrp docker` 后还是不生效，就退出 SSH 再重新登录。

### 第 5 步：拉取项目代码

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
```

### 第 6 步：执行安装脚本

现在安装脚本已经不要求你先手动编辑完整 `.env`。

只要给它管理员邮箱和密码就可以：

```bash
chmod +x scripts/install.sh scripts/update.sh scripts/quickstart-ubuntu.sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeThisPassword123!' ./scripts/install.sh
```

当前 `install.sh` 会自动完成：

- 创建 `.env`
- 生成 `AUTH_SECRET`
- 生成 `APP_ENCRYPTION_KEY`
- 写入 GitHub 和 GHCR 默认值
- 自动启用管理员后台更新脚本能力
- 如果 GHCR 镜像拉取失败，会自动回退到本地构建
- 启动 PostgreSQL 和 Redis
- 执行 Prisma 数据库步骤
- 启动 `web` 和 `worker`

### 第 7 步：安装完成后去后台继续配置

安装完成后，下面这些都可以以后再到管理员后台配置，不需要首次安装时手动写进 `.env`：

- SMTP
- AI 的 `baseUrl`
- AI 的 `apiKey`
- AI 模型
- 站点信息
- 数据源配置
- 维护模式
- GitHub / GHCR 更新配置

## 本地开发

如果你是开发者，想在本地跑起来并改代码，按下面做。

### 本地要求

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

### 第 2 步：创建 `.env`

```bash
cp .env.example .env
```

本地开发时，最少改这几个值：

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

## 以后怎么更新服务器

你以后把代码推到 `main` 之后，可以通过两种方式更新：

- 在管理员后台点击更新按钮
- 在服务器执行下面命令

```bash
cd ~/crypto-intel-papertrade
./scripts/update.sh
```

`update.sh` 会自动做这些事情：

- 拉取最新 `main`
- 把 `IMAGE_TAG` 切到最新提交 SHA
- 尝试拉取 GHCR 镜像，失败则自动本地构建
- 执行数据库迁移
- 重启服务
- 做健康检查
- 如果健康检查失败则回滚

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

### 邮箱验证码收不到

如果 `SMTP_*` 没配置，开发环境会进入预览模式，也就是只在日志里输出验证码，不会真实发邮件。

## 重要提醒

- 不要把真实密钥提交到 GitHub
- 所有真实配置都应该只放在 `.env` 和后台加密存储里
- 现在的 worker 已经具备核心骨架，但如果你要长期线上跑，还应该继续加强重试、限频、批处理和交易所兼容细节

## 参考文档

- [Docker Engine Ubuntu 安装文档](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux 安装后配置文档](https://docs.docker.com/engine/install/linux-postinstall/)
