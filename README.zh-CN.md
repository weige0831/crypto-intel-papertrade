# Crypto Intel Papertrade

[English README](./README.md)

这是一个基于 `Next.js + TypeScript` 的全栈项目，目标是把下面几类能力放到同一个平台里：

- 实时监听 `Binance` 和 `OKX` 行情
- 聚合交易所公告、RSS 和可扩展第三方消息源
- 邮箱验证码注册登录
- 现货与永续合约虚拟仓
- 用户自行配置 `OpenAI 兼容` 的 `baseUrl + apiKey + model` 做 AI 自动开仓
- 管理员后台统一配置 SMTP、GitHub、GHCR、系统更新参数
- 通过 `install.sh` 和 `update.sh` 在 Linux 服务器上部署和更新

## 项目组成

- `web`
  前台、后台和 API 都在这里
- `worker`
  负责行情接入、公告抓取、新闻聚合、AI 执行、资金费和强平循环
- `postgres`
  业务数据库
- `redis`
  实时事件总线，给 SSE 和 worker 通信使用

## 快速部署

部署目标默认是 Linux 服务器，机器上需要先安装：

- `git`
- `docker`
- `docker compose`

先拉代码并准备环境变量：

```bash
git clone https://github.com/weige0831/crypto-intel-papertrade.git
cd crypto-intel-papertrade
cp .env.example .env
```

然后至少修改下面这些配置：

- `AUTH_SECRET`
  登录会话签名密钥
- `APP_ENCRYPTION_KEY`
  数据库存储敏感信息时的加密密钥
- `ADMIN_EMAIL`
  首次初始化管理员账号
- `ADMIN_PASSWORD`
  首次初始化管理员密码
- `OPENAI_COMPAT_API_KEY`
  如果你要启用 AI 自动开仓，这里必须配置
- `SMTP_*`
  如果你要真实发送邮箱验证码，这里必须配置

执行安装：

```bash
chmod +x scripts/install.sh scripts/update.sh
GITHUB_OWNER=weige0831 ./scripts/install.sh
```

安装完成后：

- 访问地址：`http://你的服务器IP:3000`
- 管理员账号：`.env` 里的 `ADMIN_EMAIL`
- 管理员密码：`.env` 里的 `ADMIN_PASSWORD`

## 本地开发快速启动

先起数据库和 Redis：

```bash
docker compose up -d postgres redis
```

再执行：

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

分别启动前端和 worker：

```bash
npm run dev
npm run worker
```

## 更新方式

当前项目的更新链路是固定的，设计目标就是让管理员点击一次按钮就能完成更新：

1. 你在本地确认修改没问题
2. 推送到 GitHub 的 `main`
3. GitHub Actions 自动构建并推送 GHCR 镜像
4. 管理员后台调用 `/api/admin/update`
5. 服务器执行 `scripts/update.sh`
6. 拉取最新镜像、执行数据库迁移、重启服务并做健康检查

如果健康检查失败，`update.sh` 会回滚到上一个 `IMAGE_TAG`。

## 主要页面

- `/`
  总览页
- `/auth`
  注册和登录
- `/market`
  市场情报
- `/paper-trading`
  虚拟仓与手动下单
- `/ai-settings`
  用户 AI 配置
- `/alerts`
  消息与预警
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
```

## 说明

- 真实密钥不要提交到仓库，统一使用 `.env` 和后台加密存储。
- AI Key、SMTP 密码等敏感信息会在服务端加密后再入库。
- 当前 worker 已经把实时行情、公告抓取、AI 执行、资金费和强平主循环接好了，但如果你后面要把它当成长期线上系统，还应该继续加强限频、异常恢复、批处理和交易所兼容细节。
