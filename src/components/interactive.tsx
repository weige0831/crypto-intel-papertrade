"use client";

import { type ReactNode, useEffect, useState } from "react";

import { type AppLocale } from "@/lib/constants";

type FormState = {
  pending: boolean;
  message: string | null;
  payload: unknown;
};

function translateApiMessage(locale: AppLocale, message: string | undefined, ok: boolean) {
  if (locale !== "zh-CN") {
    return message ?? (ok ? "Success" : "Request failed");
  }

  const translations: Record<string, string> = {
    Success: "操作成功",
    "Request failed": "请求失败",
    "Signed in": "登录成功",
    "Signed out": "已退出登录",
    "Registration succeeded": "注册成功",
    "Verification code issued": "验证码已发送",
    "Account not found": "未找到该账户",
    "Invalid password": "密码错误",
    Unauthorized: "请先登录后再操作",
    "Verification code is invalid or expired": "验证码无效或已过期",
    "Failed to request verification code": "验证码发送失败",
    "Login failed": "登录失败",
    "Registration failed": "注册失败",
    "Order executed": "虚拟仓订单已执行",
    "Failed to place paper order": "提交虚拟仓订单失败",
    "AI settings saved": "AI 配置已保存",
    "Failed to save AI settings": "保存 AI 配置失败",
    "Admin configuration saved": "管理员配置已保存",
    "Failed to save admin configuration": "保存管理员配置失败",
    "Update finished": "更新脚本执行完成",
  };

  return message ? translations[message] ?? message : ok ? "操作成功" : "请求失败";
}

function useApiForm(locale: AppLocale) {
  const [state, setState] = useState<FormState>({
    pending: false,
    message: null,
    payload: null,
  });

  async function submit<T = Record<string, unknown>>(url: string, body: unknown) {
    setState({ pending: true, message: null, payload: null });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    setState({
      pending: false,
      message: translateApiMessage(locale, payload.message, response.ok),
      payload,
    });

    return payload as T;
  }

  return {
    state,
    submit,
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {children}
      {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}
    </label>
  );
}

function getInteractiveCopy(locale: AppLocale) {
  const zh = locale === "zh-CN";

  return {
    common: {
      requiredLogin: zh ? "请先登录后再继续。" : "Please sign in first.",
      noData: zh ? "暂无数据。" : "No data yet.",
    },
    stream: {
      title: zh ? "实时事件流" : "Realtime stream",
      connecting: zh ? "连接中" : "connecting",
      connected: zh ? "已连接" : "connected",
      reconnecting: zh ? "重连中" : "reconnecting",
      empty: zh
        ? "正在等待 Worker 事件。启动 Redis 和 Worker 后，这里会显示实时行情、公告和 AI 动作。"
        : "Waiting for worker events. Start Redis + worker to see live ticks, announcements, and AI actions.",
    },
    auth: {
      requestTitle: zh ? "获取验证码" : "Request code",
      requestDescription: zh ? "输入邮箱，获取注册验证码。" : "Enter your email to request a registration code.",
      email: zh ? "邮箱" : "Email",
      displayName: zh ? "显示名称" : "Display name",
      password: zh ? "密码" : "Password",
      code: zh ? "验证码" : "Verification code",
      sendCode: zh ? "发送验证码" : "Send code",
      sending: zh ? "发送中..." : "Sending...",
      registerTitle: zh ? "注册新账户" : "Register",
      registerDescription: zh ? "完成注册后即可进入虚拟仓和 AI 配置页面。" : "After registration you can access paper trading and AI settings.",
      register: zh ? "创建账户" : "Create account",
      registering: zh ? "注册中..." : "Registering...",
      loginTitle: zh ? "登录" : "Login",
      adminLoginTitle: zh ? "管理员登录" : "Admin sign in",
      loginDescription: zh ? "使用邮箱和密码登录。" : "Sign in with your email and password.",
      adminLoginDescription: zh ? "请使用管理员账户登录后进入后台。" : "Sign in with an admin account to continue.",
      signIn: zh ? "登录" : "Sign in",
      signingIn: zh ? "登录中..." : "Signing in...",
      previewCode: zh ? "开发预览验证码" : "Dev preview code",
      emailPlaceholder: "you@example.com",
      displayNamePlaceholder: zh ? "交易员昵称" : "Trader name",
      passwordPlaceholder: zh ? "至少 8 位密码" : "Password",
      codePlaceholder: zh ? "输入邮箱验证码" : "Verification code",
    },
    manualOrder: {
      exchange: zh ? "交易所" : "Exchange",
      instrument: zh ? "交易对" : "Instrument",
      marketType: zh ? "市场类型" : "Market type",
      side: zh ? "方向" : "Side",
      orderType: zh ? "订单类型" : "Order type",
      quantity: zh ? "数量" : "Quantity",
      leverage: zh ? "杠杆" : "Leverage",
      takeProfit: zh ? "止盈价" : "Take profit",
      stopLoss: zh ? "止损价" : "Stop loss",
      reason: zh ? "开仓理由" : "Reason / thesis",
      place: zh ? "提交虚拟仓订单" : "Place paper order",
      placing: zh ? "提交中..." : "Placing...",
    },
    ai: {
      baseUrl: zh ? "AI Base URL" : "AI Base URL",
      apiKey: zh ? "AI API Key" : "AI API Key",
      model: zh ? "模型" : "Model",
      systemPrompt: zh ? "系统提示词" : "System prompt",
      maxPositionUsd: zh ? "单笔最大仓位 (USD)" : "Max position (USD)",
      maxLeverage: zh ? "最大杠杆" : "Max leverage",
      dailyLossLimitUsd: zh ? "单日最大亏损 (USD)" : "Daily loss limit (USD)",
      enable: zh ? "启用 AI 自动执行虚拟仓开仓" : "Enable AI auto-execution for paper trading",
      save: zh ? "保存 AI 配置" : "Save AI settings",
      saving: zh ? "保存中..." : "Saving...",
      baseUrlHint: zh ? "兼容 OpenAI 风格接口的地址。" : "OpenAI-compatible base URL.",
      promptHint: zh ? "AI 会基于消息面和实时行情生成结构化交易意图。" : "AI will generate structured trade intents from news and market data.",
    },
    admin: {
      siteName: zh ? "站点名称" : "Site name",
      defaultLocale: zh ? "默认语言" : "Default locale",
      smtpHost: zh ? "SMTP 主机" : "SMTP host",
      smtpPort: zh ? "SMTP 端口" : "SMTP port",
      smtpUser: zh ? "SMTP 用户名" : "SMTP user",
      smtpPassword: zh ? "SMTP 密码" : "SMTP password",
      smtpFromEmail: zh ? "发件邮箱" : "From email",
      smtpFromName: zh ? "发件名称" : "From name",
      githubOwner: zh ? "GitHub 用户名" : "GitHub owner",
      githubRepo: zh ? "GitHub 仓库名" : "GitHub repository",
      ghcrImage: zh ? "GHCR 镜像" : "GHCR image",
      updateChannel: zh ? "更新分支" : "Update channel",
      maintenanceMode: zh ? "维护模式" : "Maintenance mode",
      save: zh ? "保存管理员配置" : "Save admin config",
      saving: zh ? "保存中..." : "Saving...",
    },
    update: {
      run: zh ? "执行 update.sh" : "Run update.sh",
      running: zh ? "更新中..." : "Updating...",
    },
  };
}

function defaultSuccessPath(locale: AppLocale, adminMode: boolean) {
  return adminMode ? `/admin?lang=${locale}` : `/paper-trading?lang=${locale}`;
}

export function LiveEventStream({ locale }: { locale: AppLocale }) {
  const copy = getInteractiveCopy(locale);
  const [events, setEvents] = useState<Array<{ type: string; createdAt: string; payload: Record<string, unknown> }>>([]);
  const [status, setStatus] = useState(copy.stream.connecting);

  useEffect(() => {
    const source = new EventSource("/api/market/stream");

    source.onopen = () => setStatus(copy.stream.connected);
    source.onerror = () => setStatus(copy.stream.reconnecting);
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; createdAt: string; payload: Record<string, unknown> };
        setEvents((current) => [parsed, ...current].slice(0, 12));
      } catch {
        return;
      }
    };

    return () => {
      source.close();
    };
  }, [copy.stream.connected, copy.stream.reconnecting]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-300">
        <span>{copy.stream.title}</span>
        <span>{status}</span>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-zinc-300">{copy.stream.empty}</div>
        ) : (
          events.map((item, index) => (
            <div key={`${item.createdAt}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-emerald-200">{item.type}</span>
                <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString(locale)}</span>
              </div>
              <pre className="mt-3 overflow-x-auto text-xs text-zinc-300">{JSON.stringify(item.payload, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AuthForms({
  locale,
  nextPath,
  adminMode = false,
}: {
  locale: AppLocale;
  nextPath?: string;
  adminMode?: boolean;
}) {
  const copy = getInteractiveCopy(locale);
  const requestCode = useApiForm(locale);
  const register = useApiForm(locale);
  const login = useApiForm(locale);
  const loginTitle = adminMode ? copy.auth.adminLoginTitle : copy.auth.loginTitle;
  const loginDescription = adminMode ? copy.auth.adminLoginDescription : copy.auth.loginDescription;

  async function handleLoginSuccess(payload: { ok?: boolean; user?: { role?: string } }) {
    if (!payload.ok) {
      return;
    }

    const target = nextPath ?? defaultSuccessPath(locale, adminMode || payload.user?.role === "ADMIN");
    window.location.assign(target);
  }

  async function handleRegisterSuccess(payload: { ok?: boolean }) {
    if (!payload.ok) {
      return;
    }

    window.location.assign(nextPath ?? defaultSuccessPath(locale, false));
  }

  if (adminMode) {
    return (
      <form
        className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const payload = await login.submit<{ ok?: boolean; user?: { role?: string } }>("/api/auth/login", {
            email: form.get("email"),
            password: form.get("password"),
          });
          await handleLoginSuccess(payload);
        }}
      >
        <div>
          <h3 className="text-lg font-semibold">{loginTitle}</h3>
          <p className="mt-1 text-sm text-zinc-400">{loginDescription}</p>
        </div>
        <Field label={copy.auth.email}>
          <input name="email" type="email" required placeholder={copy.auth.emailPlaceholder} className="input" />
        </Field>
        <Field label={copy.auth.password}>
          <input name="password" type="password" required placeholder={copy.auth.passwordPlaceholder} className="input" />
        </Field>
        <button className="button-primary" disabled={login.state.pending}>
          {login.state.pending ? copy.auth.signingIn : copy.auth.signIn}
        </button>
        {login.state.message ? <p className="text-sm text-zinc-300">{login.state.message}</p> : null}
      </form>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <form
        className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await requestCode.submit("/api/auth/request-code", {
            email: form.get("email"),
            purpose: "REGISTER",
            locale,
          });
        }}
      >
        <div>
          <h3 className="text-lg font-semibold">{copy.auth.requestTitle}</h3>
          <p className="mt-1 text-sm text-zinc-400">{copy.auth.requestDescription}</p>
        </div>
        <Field label={copy.auth.email}>
          <input name="email" type="email" required placeholder={copy.auth.emailPlaceholder} className="input" />
        </Field>
        <button className="button-primary" disabled={requestCode.state.pending}>
          {requestCode.state.pending ? copy.auth.sending : copy.auth.sendCode}
        </button>
        {requestCode.state.message ? <p className="text-sm text-zinc-300">{requestCode.state.message}</p> : null}
        {(requestCode.state.payload as { previewCode?: string } | null)?.previewCode ? (
          <p className="text-sm text-amber-200">
            {copy.auth.previewCode}: {(requestCode.state.payload as { previewCode: string }).previewCode}
          </p>
        ) : null}
      </form>

      <form
        className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const payload = await register.submit<{ ok?: boolean }>("/api/auth/register", {
            email: form.get("email"),
            password: form.get("password"),
            displayName: form.get("displayName"),
            code: form.get("code"),
            locale,
          });
          await handleRegisterSuccess(payload);
        }}
      >
        <div>
          <h3 className="text-lg font-semibold">{copy.auth.registerTitle}</h3>
          <p className="mt-1 text-sm text-zinc-400">{copy.auth.registerDescription}</p>
        </div>
        <Field label={copy.auth.displayName}>
          <input name="displayName" placeholder={copy.auth.displayNamePlaceholder} className="input" />
        </Field>
        <Field label={copy.auth.email}>
          <input name="email" type="email" required placeholder={copy.auth.emailPlaceholder} className="input" />
        </Field>
        <Field label={copy.auth.password}>
          <input name="password" type="password" required placeholder={copy.auth.passwordPlaceholder} className="input" />
        </Field>
        <Field label={copy.auth.code}>
          <input name="code" required placeholder={copy.auth.codePlaceholder} className="input" />
        </Field>
        <button className="button-primary" disabled={register.state.pending}>
          {register.state.pending ? copy.auth.registering : copy.auth.register}
        </button>
        {register.state.message ? <p className="text-sm text-zinc-300">{register.state.message}</p> : null}
      </form>

      <form
        className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const payload = await login.submit<{ ok?: boolean; user?: { role?: string } }>("/api/auth/login", {
            email: form.get("email"),
            password: form.get("password"),
          });
          await handleLoginSuccess(payload);
        }}
      >
        <div>
          <h3 className="text-lg font-semibold">{copy.auth.loginTitle}</h3>
          <p className="mt-1 text-sm text-zinc-400">{copy.auth.loginDescription}</p>
        </div>
        <Field label={copy.auth.email}>
          <input name="email" type="email" required placeholder={copy.auth.emailPlaceholder} className="input" />
        </Field>
        <Field label={copy.auth.password}>
          <input name="password" type="password" required placeholder={copy.auth.passwordPlaceholder} className="input" />
        </Field>
        <button className="button-primary" disabled={login.state.pending}>
          {login.state.pending ? copy.auth.signingIn : copy.auth.signIn}
        </button>
        {login.state.message ? <p className="text-sm text-zinc-300">{login.state.message}</p> : null}
      </form>
    </div>
  );
}

export function ManualOrderForm({ portfolioId, locale }: { portfolioId: string; locale: AppLocale }) {
  const copy = getInteractiveCopy(locale);
  const order = useApiForm(locale);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await order.submit("/api/paper-trading/orders", {
          portfolioId,
          exchange: form.get("exchange"),
          instrument: form.get("instrument"),
          marketType: form.get("marketType"),
          side: form.get("side"),
          orderType: form.get("orderType"),
          quantity: Number(form.get("quantity")),
          leverage: Number(form.get("leverage")),
          takeProfit: form.get("takeProfit") ? Number(form.get("takeProfit")) : undefined,
          stopLoss: form.get("stopLoss") ? Number(form.get("stopLoss")) : undefined,
          reason: form.get("reason"),
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={copy.manualOrder.exchange}>
          <input name="exchange" defaultValue="SIMULATED" className="input" />
        </Field>
        <Field label={copy.manualOrder.instrument}>
          <input name="instrument" defaultValue="BTCUSDT" className="input" />
        </Field>
        <Field label={copy.manualOrder.marketType}>
          <select name="marketType" className="input">
            <option value="SPOT">SPOT</option>
            <option value="PERPETUAL">PERPETUAL</option>
          </select>
        </Field>
        <Field label={copy.manualOrder.side}>
          <select name="side" className="input">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </Field>
        <Field label={copy.manualOrder.orderType}>
          <select name="orderType" className="input">
            <option value="MARKET">MARKET</option>
            <option value="LIMIT">LIMIT</option>
          </select>
        </Field>
        <Field label={copy.manualOrder.quantity}>
          <input name="quantity" type="number" step="0.0001" defaultValue="0.01" className="input" />
        </Field>
        <Field label={copy.manualOrder.leverage}>
          <input name="leverage" type="number" min="1" max="20" defaultValue="3" className="input" />
        </Field>
        <Field label={copy.manualOrder.takeProfit}>
          <input name="takeProfit" type="number" step="0.0001" className="input" />
        </Field>
        <Field label={copy.manualOrder.stopLoss}>
          <input name="stopLoss" type="number" step="0.0001" className="input" />
        </Field>
        <div className="md:col-span-2">
          <Field label={copy.manualOrder.reason}>
            <input name="reason" placeholder={copy.manualOrder.reason} className="input" />
          </Field>
        </div>
      </div>
      <button className="button-primary" disabled={order.state.pending}>
        {order.state.pending ? copy.manualOrder.placing : copy.manualOrder.place}
      </button>
      {order.state.message ? <p className="text-sm text-zinc-300">{order.state.message}</p> : null}
    </form>
  );
}

export function AiSettingsForm({
  initial,
  locale,
}: {
  locale: AppLocale;
  initial?: {
    baseUrl?: string;
    model?: string;
    systemPrompt?: string;
    maxPositionUsd?: number;
    riskLimits?: { maxLeverage?: number; dailyLossLimitUsd?: number };
    enabled?: boolean;
  } | null;
}) {
  const copy = getInteractiveCopy(locale);
  const api = useApiForm(locale);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await api.submit("/api/ai-settings", {
          baseUrl: form.get("baseUrl"),
          apiKey: form.get("apiKey"),
          model: form.get("model"),
          systemPrompt: form.get("systemPrompt"),
          maxPositionUsd: Number(form.get("maxPositionUsd")),
          allowedMarkets: ["SPOT", "PERPETUAL"],
          enabled: form.get("enabled") === "on",
          maxLeverage: Number(form.get("maxLeverage")),
          dailyLossLimitUsd: Number(form.get("dailyLossLimitUsd")),
        });
      }}
    >
      <Field label={copy.ai.baseUrl} hint={copy.ai.baseUrlHint}>
        <input name="baseUrl" defaultValue={initial?.baseUrl ?? "https://api.openai.com/v1"} className="input" />
      </Field>
      <Field label={copy.ai.apiKey}>
        <input name="apiKey" type="password" placeholder={copy.ai.apiKey} className="input" />
      </Field>
      <Field label={copy.ai.model}>
        <input name="model" defaultValue={initial?.model ?? "gpt-4.1-mini"} className="input" />
      </Field>
      <Field label={copy.ai.systemPrompt} hint={copy.ai.promptHint}>
        <textarea
          name="systemPrompt"
          defaultValue={
            initial?.systemPrompt ??
            "Use exchange notices, market dislocations, and recent news to generate one conservative paper trading intent."
          }
          className="input min-h-32"
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label={copy.ai.maxPositionUsd}>
          <input name="maxPositionUsd" type="number" defaultValue={initial?.maxPositionUsd ?? 100} className="input" />
        </Field>
        <Field label={copy.ai.maxLeverage}>
          <input name="maxLeverage" type="number" defaultValue={initial?.riskLimits?.maxLeverage ?? 3} className="input" />
        </Field>
        <Field label={copy.ai.dailyLossLimitUsd}>
          <input
            name="dailyLossLimitUsd"
            type="number"
            defaultValue={initial?.riskLimits?.dailyLossLimitUsd ?? 500}
            className="input"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input name="enabled" type="checkbox" defaultChecked={initial?.enabled ?? false} />
        {copy.ai.enable}
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? copy.ai.saving : copy.ai.save}
      </button>
      {api.state.message ? <p className="text-sm text-zinc-300">{api.state.message}</p> : null}
    </form>
  );
}

export function AdminConfigForm({
  initial,
  locale,
}: {
  locale: AppLocale;
  initial?: {
    siteName?: string;
    defaultLocale?: string;
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpFromEmail?: string | null;
    smtpFromName?: string | null;
    githubOwner?: string | null;
    githubRepo?: string | null;
    ghcrImage?: string | null;
    updateChannel?: string | null;
    maintenanceMode?: boolean;
  } | null;
}) {
  const copy = getInteractiveCopy(locale);
  const api = useApiForm(locale);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await api.submit("/api/admin/config", {
          siteName: form.get("siteName"),
          defaultLocale: form.get("defaultLocale"),
          smtpHost: form.get("smtpHost"),
          smtpPort: Number(form.get("smtpPort")),
          smtpUser: form.get("smtpUser"),
          smtpPassword: form.get("smtpPassword"),
          smtpFromEmail: form.get("smtpFromEmail"),
          smtpFromName: form.get("smtpFromName"),
          githubOwner: form.get("githubOwner"),
          githubRepo: form.get("githubRepo"),
          ghcrImage: form.get("ghcrImage"),
          updateChannel: form.get("updateChannel"),
          maintenanceMode: form.get("maintenanceMode") === "on",
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={copy.admin.siteName}>
          <input name="siteName" defaultValue={initial?.siteName ?? "Crypto Intel Papertrade"} className="input" />
        </Field>
        <Field label={copy.admin.defaultLocale}>
          <select name="defaultLocale" defaultValue={initial?.defaultLocale ?? "zh-CN"} className="input">
            <option value="zh-CN">zh-CN</option>
            <option value="en-US">en-US</option>
          </select>
        </Field>
        <Field label={copy.admin.smtpHost}>
          <input name="smtpHost" defaultValue={initial?.smtpHost ?? ""} className="input" />
        </Field>
        <Field label={copy.admin.smtpPort}>
          <input name="smtpPort" type="number" defaultValue={initial?.smtpPort ?? 587} className="input" />
        </Field>
        <Field label={copy.admin.smtpUser}>
          <input name="smtpUser" defaultValue={initial?.smtpUser ?? ""} className="input" />
        </Field>
        <Field label={copy.admin.smtpPassword}>
          <input name="smtpPassword" type="password" placeholder={copy.admin.smtpPassword} className="input" />
        </Field>
        <Field label={copy.admin.smtpFromEmail}>
          <input name="smtpFromEmail" defaultValue={initial?.smtpFromEmail ?? ""} className="input" />
        </Field>
        <Field label={copy.admin.smtpFromName}>
          <input name="smtpFromName" defaultValue={initial?.smtpFromName ?? "Crypto Intel"} className="input" />
        </Field>
        <Field label={copy.admin.githubOwner}>
          <input name="githubOwner" defaultValue={initial?.githubOwner ?? ""} className="input" />
        </Field>
        <Field label={copy.admin.githubRepo}>
          <input name="githubRepo" defaultValue={initial?.githubRepo ?? "crypto-intel-papertrade"} className="input" />
        </Field>
        <Field label={copy.admin.ghcrImage}>
          <input name="ghcrImage" defaultValue={initial?.ghcrImage ?? ""} className="input" />
        </Field>
        <Field label={copy.admin.updateChannel}>
          <input name="updateChannel" defaultValue={initial?.updateChannel ?? "main"} className="input" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input name="maintenanceMode" type="checkbox" defaultChecked={initial?.maintenanceMode ?? false} />
        {copy.admin.maintenanceMode}
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? copy.admin.saving : copy.admin.save}
      </button>
      {api.state.message ? <p className="text-sm text-zinc-300">{api.state.message}</p> : null}
    </form>
  );
}

export function UpdateTriggerButton({ locale }: { locale: AppLocale }) {
  const copy = getInteractiveCopy(locale);
  const api = useApiForm(locale);

  return (
    <div className="space-y-3">
      <button
        className="button-primary"
        disabled={api.state.pending}
        onClick={() => {
          api.submit("/api/admin/update", {});
        }}
      >
        {api.state.pending ? copy.update.running : copy.update.run}
      </button>
      {api.state.message ? <p className="text-sm text-zinc-300">{api.state.message}</p> : null}
      {api.state.payload ? (
        <pre className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-300">
          {JSON.stringify(api.state.payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
