"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { type AppLocale } from "@/lib/constants";
import { cn, formatPercent, formatUsd, niceDate } from "@/lib/utils";

type FormState = {
  pending: boolean;
  message: string | null;
  payload: unknown;
};

type LiveRuntimeEvent = {
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

type RankingRow = {
  instrument: string;
  displaySymbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  marketType: "SPOT" | "PERPETUAL";
  last: number | null;
  priceChangePercent24h: number | null;
  quoteVolume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  availableMarkets: number;
  exchanges: string[];
};

const zh = {
  success: "操作成功",
  failed: "请求失败",
  signedIn: "登录成功",
  signedOut: "已退出登录",
  registerDone: "注册成功",
  codeSent: "验证码已发送",
  invalidPassword: "密码错误",
  accountNotFound: "未找到该账号",
  unauthorized: "请先登录后再操作",
  invalidCode: "验证码无效或已过期",
  requestCodeFailed: "验证码发送失败",
  registerFailed: "注册失败",
  loginFailed: "登录失败",
  resetDone: "密码重置成功",
  resetFailed: "密码重置失败",
  aiSaved: "AI 配置已保存",
  aiSaveFailed: "保存 AI 配置失败",
  adminSaved: "管理员配置已保存",
  adminSaveFailed: "保存管理员配置失败",
  orderDone: "虚拟仓订单已执行",
  orderFailed: "虚拟仓下单失败",
  updateDone: "更新完成",
  adminOnly: "该账号不是管理员账号",
  mismatch: "两次输入的密码不一致",
};

const en = {
  success: "Success",
  failed: "Request failed",
  signedIn: "Signed in",
  signedOut: "Signed out",
  registerDone: "Registration succeeded",
  codeSent: "Verification code issued",
  invalidPassword: "Invalid password",
  accountNotFound: "Account not found",
  unauthorized: "Unauthorized",
  invalidCode: "Verification code is invalid or expired",
  requestCodeFailed: "Failed to request verification code",
  registerFailed: "Registration failed",
  loginFailed: "Login failed",
  resetDone: "Password reset succeeded",
  resetFailed: "Failed to reset password",
  aiSaved: "AI settings saved",
  aiSaveFailed: "Failed to save AI settings",
  adminSaved: "Admin configuration saved",
  adminSaveFailed: "Failed to save admin configuration",
  orderDone: "Order executed",
  orderFailed: "Failed to place paper order",
  updateDone: "Update finished",
  adminOnly: "This account is not an administrator account",
  mismatch: "Passwords do not match",
};

function dictionary(locale: AppLocale) {
  return locale === "zh-CN" ? zh : en;
}

function translateApiMessage(locale: AppLocale, message: string | undefined, ok: boolean) {
  if (!message) {
    return ok ? dictionary(locale).success : dictionary(locale).failed;
  }

  const map: Record<string, string> =
    locale === "zh-CN"
      ? {
          "Signed in": zh.signedIn,
          "Signed out": zh.signedOut,
          "Registration succeeded": zh.registerDone,
          "Verification code issued": zh.codeSent,
          "Account not found": zh.accountNotFound,
          "Invalid password": zh.invalidPassword,
          Unauthorized: zh.unauthorized,
          "Verification code is invalid or expired": zh.invalidCode,
          "Failed to request verification code": zh.requestCodeFailed,
          "Registration failed": zh.registerFailed,
          "Login failed": zh.loginFailed,
          "Password reset succeeded": zh.resetDone,
          "Failed to reset password": zh.resetFailed,
          "AI settings saved": zh.aiSaved,
          "Failed to save AI settings": zh.aiSaveFailed,
          "Admin configuration saved": zh.adminSaved,
          "Failed to save admin configuration": zh.adminSaveFailed,
          "Order executed": zh.orderDone,
          "Failed to place paper order": zh.orderFailed,
          "Update finished": zh.updateDone,
          "Passwords do not match": zh.mismatch,
        }
      : {};

  return map[message] ?? message;
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

  return { state, submit };
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
      <span className="text-sm font-medium text-slate-100">{label}</span>
      {children}
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function formCopy(locale: AppLocale) {
  const isZh = locale === "zh-CN";

  return {
    stream: {
      title: isZh ? "实时消息流" : "Realtime intel stream",
      connecting: isZh ? "连接中" : "connecting",
      connected: isZh ? "已连接" : "connected",
      reconnecting: isZh ? "重连中" : "reconnecting",
      emptyIntel: isZh ? "正在等待公告、新闻、AI 信号和预警事件。" : "Waiting for announcements, news, AI signals, and alerts.",
      emptyAll: isZh ? "正在等待完整实时事件流。" : "Waiting for the full runtime event stream.",
      intelMode: isZh ? "消息面优先" : "Intel mode",
      allMode: isZh ? "完整事件流" : "All events",
    },
    auth: {
      email: isZh ? "邮箱" : "Email",
      displayName: isZh ? "显示名称" : "Display name",
      password: isZh ? "密码" : "Password",
      passwordNew: isZh ? "新密码" : "New password",
      passwordConfirm: isZh ? "确认新密码" : "Confirm new password",
      code: isZh ? "验证码" : "Verification code",
      sendCode: isZh ? "发送验证码" : "Send code",
      sending: isZh ? "发送中..." : "Sending...",
      signIn: isZh ? "登录" : "Sign in",
      signingIn: isZh ? "登录中..." : "Signing in...",
      register: isZh ? "完成注册" : "Create account",
      registering: isZh ? "注册中..." : "Creating account...",
      reset: isZh ? "重置密码" : "Reset password",
      resetting: isZh ? "重置中..." : "Resetting...",
      previewCode: isZh ? "开发环境验证码" : "Dev preview code",
      emailPlaceholder: "you@example.com",
      displayNamePlaceholder: isZh ? "交易员昵称" : "Trader alias",
      passwordPlaceholder: isZh ? "至少 8 位密码" : "At least 8 characters",
      codePlaceholder: isZh ? "输入收到的验证码" : "Enter the code",
      adminOnly: dictionary(locale).adminOnly,
      mismatch: dictionary(locale).mismatch,
      forgotLink: isZh ? "忘记密码？" : "Forgot password?",
      loginLink: isZh ? "返回登录" : "Back to login",
      registerLink: isZh ? "没有账号？去注册" : "Need an account? Register",
    },
    manualOrder: {
      exchange: isZh ? "交易所" : "Exchange",
      instrument: isZh ? "币种" : "Instrument",
      marketType: isZh ? "市场类型" : "Market type",
      side: isZh ? "方向" : "Side",
      orderType: isZh ? "订单类型" : "Order type",
      quantity: isZh ? "数量" : "Quantity",
      leverage: isZh ? "杠杆" : "Leverage",
      takeProfit: isZh ? "止盈价" : "Take profit",
      stopLoss: isZh ? "止损价" : "Stop loss",
      reason: isZh ? "开仓理由" : "Trade thesis",
      place: isZh ? "提交虚拟仓订单" : "Place paper order",
      placing: isZh ? "提交中..." : "Placing...",
    },
    ai: {
      baseUrl: "AI Base URL",
      apiKey: "AI API Key",
      model: isZh ? "模型" : "Model",
      systemPrompt: isZh ? "系统提示词" : "System prompt",
      maxPositionUsd: isZh ? "单笔最大仓位 (USD)" : "Max position (USD)",
      maxLeverage: isZh ? "最大杠杆" : "Max leverage",
      dailyLossLimitUsd: isZh ? "单日最大亏损 (USD)" : "Daily loss limit (USD)",
      enable: isZh ? "启用 AI 自动开虚拟仓" : "Enable AI auto execution for paper trading",
      save: isZh ? "保存 AI 配置" : "Save AI settings",
      saving: isZh ? "保存中..." : "Saving...",
      baseUrlHint: isZh ? "兼容 OpenAI 风格接口。" : "OpenAI-compatible endpoint.",
      promptHint: isZh ? "AI 会基于消息面和行情生成结构化交易意图。" : "AI uses news and market data to generate structured trade intents.",
    },
    admin: {
      siteName: isZh ? "站点名称" : "Site name",
      defaultLocale: isZh ? "默认语言" : "Default locale",
      smtpHost: "SMTP Host",
      smtpPort: "SMTP Port",
      smtpUser: "SMTP User",
      smtpPassword: "SMTP Password",
      smtpFromEmail: isZh ? "发件邮箱" : "From email",
      smtpFromName: isZh ? "发件名称" : "From name",
      githubOwner: "GitHub Owner",
      githubRepo: "GitHub Repo",
      ghcrImage: "GHCR Image",
      updateChannel: isZh ? "更新分支" : "Update channel",
      maintenanceMode: isZh ? "维护模式" : "Maintenance mode",
      save: isZh ? "保存管理员配置" : "Save admin config",
      saving: isZh ? "保存中..." : "Saving...",
    },
    update: {
      run: isZh ? "执行 update.sh" : "Run update.sh",
      running: isZh ? "更新中..." : "Updating...",
    },
    rankings: {
      volume: isZh ? "成交额榜" : "Turnover",
      movers: isZh ? "24h 涨幅榜" : "24h Gainers",
      losers: isZh ? "24h 跌幅榜" : "24h Losers",
      venueCount: isZh ? "可用市场" : "Markets",
      turnover: isZh ? "24h 成交额" : "24h turnover",
    },
  };
}

function defaultSuccessPath(locale: AppLocale, adminMode: boolean) {
  return adminMode ? `/admin?lang=${locale}` : `/paper-trading?lang=${locale}`;
}

function getEventTone(type: string) {
  switch (type) {
    case "announcement":
    case "news_item":
      return "border-sky-400/25 bg-sky-500/10 text-sky-100";
    case "ai_signal":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
    case "market_alert":
      return "border-amber-400/25 bg-amber-500/10 text-amber-100";
    case "system_update_status":
      return "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100";
    default:
      return "border-white/10 bg-white/5 text-slate-100";
  }
}

function renderEventSummary(locale: AppLocale, event: LiveRuntimeEvent) {
  const isZh = locale === "zh-CN";
  const payload = event.payload;

  if (event.type === "announcement") {
    return {
      heading: String(payload.title ?? (isZh ? "交易所公告" : "Exchange announcement")),
      subheading: String(payload.exchange ?? payload.source ?? "Exchange"),
      body: String(payload.summary ?? payload.url ?? ""),
    };
  }

  if (event.type === "news_item") {
    return {
      heading: String(payload.title ?? (isZh ? "新闻消息" : "News item")),
      subheading: String(payload.sourceName ?? payload.source ?? "Feed"),
      body: String(payload.summary ?? payload.url ?? ""),
    };
  }

  if (event.type === "ai_signal") {
    return {
      heading: `${String(payload.instrument ?? "AI")} ${String(payload.side ?? "")}`.trim(),
      subheading: `${String(payload.marketType ?? "")} ${String(payload.confidence ?? "")}`.trim(),
      body: String(payload.thesis ?? payload.reason ?? (isZh ? "AI 已生成交易意图。" : "AI produced a trade intent.")),
    };
  }

  if (event.type === "market_alert") {
    return {
      heading: `${String(payload.instrument ?? "Alert")} ${String(payload.severity ?? "")}`.trim(),
      subheading: String(payload.exchange ?? (isZh ? "市场预警" : "Market alert")),
      body: String(payload.reason ?? payload.message ?? ""),
    };
  }

  if (event.type === "market_tick") {
    return {
      heading: `${String(payload.exchange ?? "")} ${String(payload.instrument ?? "")}`.trim(),
      subheading: `${formatUsd(Number(payload.last ?? 0))} · ${formatPercent(Number(payload.priceChangePercent24h ?? 0))}`,
      body: `${isZh ? "24h 成交额" : "24h turnover"} ${formatUsd(Number(payload.quoteVolume24h ?? payload.volume24h ?? 0))}`,
    };
  }

  return {
    heading: event.type,
    subheading: "",
    body: JSON.stringify(payload),
  };
}

export function LiveEventStream({
  locale,
  mode = "intel",
  instrument,
  maxItems = 10,
}: {
  locale: AppLocale;
  mode?: "intel" | "all";
  instrument?: string;
  maxItems?: number;
}) {
  const copy = formCopy(locale);
  const [events, setEvents] = useState<LiveRuntimeEvent[]>([]);
  const [status, setStatus] = useState(copy.stream.connecting);
  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ mode });
    if (instrument) {
      params.set("instrument", instrument);
    }

    return `/api/market/stream?${params.toString()}`;
  }, [instrument, mode]);

  useEffect(() => {
    const source = new EventSource(endpoint);

    source.onopen = () => setStatus(copy.stream.connected);
    source.onerror = () => setStatus(copy.stream.reconnecting);
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as LiveRuntimeEvent;
        setEvents((current) => [parsed, ...current].slice(0, maxItems));
      } catch {
        return;
      }
    };

    return () => {
      source.close();
    };
  }, [copy.stream.connected, copy.stream.reconnecting, endpoint, maxItems]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
        <span>{mode === "intel" ? copy.stream.intelMode : copy.stream.allMode}</span>
        <span>{status}</span>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-slate-950/30 px-4 py-5 text-sm text-slate-300">
            {mode === "intel" ? copy.stream.emptyIntel : copy.stream.emptyAll}
          </div>
        ) : (
          events.map((item, index) => {
            const summary = renderEventSummary(locale, item);

            return (
              <div key={`${item.createdAt}-${index}`} className={cn("rounded-[24px] border px-4 py-4", getEventTone(item.type))}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{summary.heading}</p>
                    {summary.subheading ? <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-300">{summary.subheading}</p> : null}
                  </div>
                  <p className="text-xs text-slate-300">{niceDate(item.createdAt, locale)}</p>
                </div>
                {summary.body ? <p className="mt-3 text-sm leading-6 text-slate-200">{summary.body}</p> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function LoginForm({
  locale,
  nextPath,
  adminMode = false,
}: {
  locale: AppLocale;
  nextPath?: string;
  adminMode?: boolean;
}) {
  const copy = formCopy(locale);
  const api = useApiForm(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const payload = await api.submit<{ ok?: boolean; user?: { role?: string } }>("/api/auth/login", {
          email,
          password,
        });

        if (!payload.ok) {
          return;
        }

        if (adminMode && payload.user?.role !== "ADMIN") {
          setMessage(copy.auth.adminOnly);
          return;
        }

        window.location.assign(nextPath ?? defaultSuccessPath(locale, adminMode || payload.user?.role === "ADMIN"));
      }}
    >
      <Field label={copy.auth.email}>
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.auth.emailPlaceholder} required />
      </Field>
      <Field label={copy.auth.password}>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.passwordPlaceholder}
          required
        />
      </Field>
      <button className="button-primary w-full" disabled={api.state.pending}>
        {api.state.pending ? copy.auth.signingIn : copy.auth.signIn}
      </button>
      {message ?? api.state.message ? <p className="text-sm text-slate-300">{message ?? api.state.message}</p> : null}
    </form>
  );
}

export function RegisterForm({
  locale,
  nextPath,
}: {
  locale: AppLocale;
  nextPath?: string;
}) {
  const copy = formCopy(locale);
  const requestCode = useApiForm(locale);
  const register = useApiForm(locale);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const previewCode = (requestCode.state.payload as { previewCode?: string } | null)?.previewCode;

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const payload = await register.submit<{ ok?: boolean }>("/api/auth/register", {
          email,
          displayName: displayName || undefined,
          password,
          code,
          locale,
        });

        if (payload.ok) {
          window.location.assign(nextPath ?? `/paper-trading?lang=${locale}`);
        }
      }}
    >
      <Field label={copy.auth.displayName}>
        <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={copy.auth.displayNamePlaceholder} />
      </Field>
      <Field label={copy.auth.email}>
        <div className="flex flex-col gap-3 md:flex-row">
          <input className="input flex-1" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.auth.emailPlaceholder} required />
          <button
            type="button"
            className="button-secondary min-w-40"
            disabled={requestCode.state.pending || !email}
            onClick={() => requestCode.submit("/api/auth/request-code", { email, purpose: "REGISTER", locale })}
          >
            {requestCode.state.pending ? copy.auth.sending : copy.auth.sendCode}
          </button>
        </div>
      </Field>
      {requestCode.state.message ? <p className="text-sm text-slate-300">{requestCode.state.message}</p> : null}
      {previewCode ? (
        <p className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {copy.auth.previewCode}: {previewCode}
        </p>
      ) : null}
      <Field label={copy.auth.code}>
        <input className="input" value={code} onChange={(event) => setCode(event.target.value)} placeholder={copy.auth.codePlaceholder} required />
      </Field>
      <Field label={copy.auth.password}>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.passwordPlaceholder}
          required
        />
      </Field>
      <button className="button-primary w-full" disabled={register.state.pending}>
        {register.state.pending ? copy.auth.registering : copy.auth.register}
      </button>
      {register.state.message ? <p className="text-sm text-slate-300">{register.state.message}</p> : null}
    </form>
  );
}

export function ForgotPasswordForm({ locale }: { locale: AppLocale }) {
  const copy = formCopy(locale);
  const requestCode = useApiForm(locale);
  const reset = useApiForm(locale);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const previewCode = (requestCode.state.payload as { previewCode?: string } | null)?.previewCode;

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
          setMessage(copy.auth.mismatch);
          return;
        }

        const payload = await reset.submit<{ ok?: boolean }>("/api/auth/reset-password", {
          email,
          code,
          password,
          confirmPassword,
        });

        if (payload.ok) {
          window.location.assign(`/auth/login?lang=${locale}`);
        }
      }}
    >
      <Field label={copy.auth.email}>
        <div className="flex flex-col gap-3 md:flex-row">
          <input className="input flex-1" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.auth.emailPlaceholder} required />
          <button
            type="button"
            className="button-secondary min-w-40"
            disabled={requestCode.state.pending || !email}
            onClick={() => requestCode.submit("/api/auth/request-code", { email, purpose: "RESET_PASSWORD", locale })}
          >
            {requestCode.state.pending ? copy.auth.sending : copy.auth.sendCode}
          </button>
        </div>
      </Field>
      {requestCode.state.message ? <p className="text-sm text-slate-300">{requestCode.state.message}</p> : null}
      {previewCode ? (
        <p className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {copy.auth.previewCode}: {previewCode}
        </p>
      ) : null}
      <Field label={copy.auth.code}>
        <input className="input" value={code} onChange={(event) => setCode(event.target.value)} placeholder={copy.auth.codePlaceholder} required />
      </Field>
      <Field label={copy.auth.passwordNew}>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.auth.passwordPlaceholder}
          required
        />
      </Field>
      <Field label={copy.auth.passwordConfirm}>
        <input
          className="input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={copy.auth.passwordPlaceholder}
          required
        />
      </Field>
      <button className="button-primary w-full" disabled={reset.state.pending}>
        {reset.state.pending ? copy.auth.resetting : copy.auth.reset}
      </button>
      {message ?? reset.state.message ? <p className="text-sm text-slate-300">{message ?? reset.state.message}</p> : null}
    </form>
  );
}

export function MarketRankingsBoard({
  locale,
  rankings,
}: {
  locale: AppLocale;
  rankings: {
    volume: RankingRow[];
    movers: RankingRow[];
    losers: RankingRow[];
  };
}) {
  const copy = formCopy(locale);
  const [tab, setTab] = useState<"volume" | "movers" | "losers">("volume");
  const items = rankings[tab];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["volume", copy.rankings.volume],
          ["movers", copy.rankings.movers],
          ["losers", copy.rankings.losers],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              tab === value
                ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((row, index) => (
          <Link
            key={`${tab}-${row.instrument}`}
            href={`/market/${row.instrument}?lang=${locale}`}
            className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/45 px-4 py-4 transition hover:border-emerald-300/40 hover:bg-slate-950/70"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{row.displaySymbol}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                    {row.exchange} · {row.marketType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{formatUsd(row.last ?? 0)}</p>
                <p className={cn("mt-1 text-sm", (row.priceChangePercent24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300")}>
                  {formatPercent(row.priceChangePercent24h ?? 0)}
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <p>
                {copy.rankings.turnover}: <span className="text-white">{formatUsd(row.quoteVolume24h ?? 0)}</span>
              </p>
              <p>
                {copy.rankings.venueCount}: <span className="text-white">{row.availableMarkets}</span>
              </p>
              <p className="text-slate-400">{row.exchanges.join(" / ")}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ManualOrderForm({ portfolioId, locale }: { portfolioId: string; locale: AppLocale }) {
  const copy = formCopy(locale);
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
      {order.state.message ? <p className="text-sm text-slate-300">{order.state.message}</p> : null}
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
  const copy = formCopy(locale);
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
            "Use exchange notices, breaking news, and market dislocations to produce one conservative paper trading idea."
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
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input name="enabled" type="checkbox" defaultChecked={initial?.enabled ?? false} />
        {copy.ai.enable}
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? copy.ai.saving : copy.ai.save}
      </button>
      {api.state.message ? <p className="text-sm text-slate-300">{api.state.message}</p> : null}
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
  const copy = formCopy(locale);
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
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input name="maintenanceMode" type="checkbox" defaultChecked={initial?.maintenanceMode ?? false} />
        {copy.admin.maintenanceMode}
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? copy.admin.saving : copy.admin.save}
      </button>
      {api.state.message ? <p className="text-sm text-slate-300">{api.state.message}</p> : null}
    </form>
  );
}

export function UpdateTriggerButton({ locale }: { locale: AppLocale }) {
  const copy = formCopy(locale);
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
      {api.state.message ? <p className="text-sm text-slate-300">{api.state.message}</p> : null}
      {api.state.payload ? (
        <pre className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 text-xs text-slate-300">
          {JSON.stringify(api.state.payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
