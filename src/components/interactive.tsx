"use client";

import { useEffect, useState } from "react";

type FormState = {
  pending: boolean;
  message: string | null;
  payload: unknown;
};

function useApiForm() {
  const [state, setState] = useState<FormState>({
    pending: false,
    message: null,
    payload: null,
  });

  async function submit(url: string, body: unknown) {
    setState({ pending: true, message: null, payload: null });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    setState({
      pending: false,
      message: (payload as { message?: string }).message ?? (response.ok ? "Success" : "Request failed"),
      payload,
    });

    return payload;
  }

  return {
    state,
    submit,
  };
}

export function LiveEventStream() {
  const [events, setEvents] = useState<Array<{ type: string; createdAt: string; payload: Record<string, unknown> }>>([]);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const source = new EventSource("/api/market/stream");

    source.onopen = () => setStatus("connected");
    source.onerror = () => setStatus("reconnecting");
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
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-300">
        <span>Realtime stream</span>
        <span>{status}</span>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-zinc-300">
            Waiting for worker events. Start Redis + worker to see live ticks, announcements, and AI actions.
          </div>
        ) : (
          events.map((item, index) => (
            <div key={`${item.createdAt}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-emerald-200">{item.type}</span>
                <span className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <pre className="mt-3 overflow-x-auto text-xs text-zinc-300">{JSON.stringify(item.payload, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AuthForms({ locale }: { locale: string }) {
  const requestCode = useApiForm();
  const register = useApiForm();
  const login = useApiForm();

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <form
        className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4"
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
        <h3 className="text-lg font-semibold">Request code</h3>
        <input name="email" type="email" required placeholder="you@example.com" className="input" />
        <button className="button-primary" disabled={requestCode.state.pending}>
          {requestCode.state.pending ? "Sending..." : "Send code"}
        </button>
        {requestCode.state.message ? <p className="text-sm text-zinc-300">{requestCode.state.message}</p> : null}
        {(requestCode.state.payload as { previewCode?: string } | null)?.previewCode ? (
          <p className="text-sm text-amber-200">
            Dev preview code: {(requestCode.state.payload as { previewCode: string }).previewCode}
          </p>
        ) : null}
      </form>

      <form
        className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await register.submit("/api/auth/register", {
            email: form.get("email"),
            password: form.get("password"),
            displayName: form.get("displayName"),
            code: form.get("code"),
            locale,
          });
        }}
      >
        <h3 className="text-lg font-semibold">Register</h3>
        <input name="displayName" placeholder="Trader name" className="input" />
        <input name="email" type="email" required placeholder="you@example.com" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" />
        <input name="code" required placeholder="Verification code" className="input" />
        <button className="button-primary" disabled={register.state.pending}>
          {register.state.pending ? "Registering..." : "Create account"}
        </button>
        {register.state.message ? <p className="text-sm text-zinc-300">{register.state.message}</p> : null}
      </form>

      <form
        className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await login.submit("/api/auth/login", {
            email: form.get("email"),
            password: form.get("password"),
          });
        }}
      >
        <h3 className="text-lg font-semibold">Login</h3>
        <input name="email" type="email" required placeholder="you@example.com" className="input" />
        <input name="password" type="password" required placeholder="Password" className="input" />
        <button className="button-primary" disabled={login.state.pending}>
          {login.state.pending ? "Signing in..." : "Sign in"}
        </button>
        {login.state.message ? <p className="text-sm text-zinc-300">{login.state.message}</p> : null}
      </form>
    </div>
  );
}

export function ManualOrderForm({ portfolioId }: { portfolioId: string }) {
  const order = useApiForm();

  return (
    <form
      className="space-y-3"
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
        <input name="exchange" defaultValue="SIMULATED" className="input" />
        <input name="instrument" defaultValue="BTCUSDT" className="input" />
        <select name="marketType" className="input">
          <option value="SPOT">SPOT</option>
          <option value="PERPETUAL">PERPETUAL</option>
        </select>
        <select name="side" className="input">
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <select name="orderType" className="input">
          <option value="MARKET">MARKET</option>
          <option value="LIMIT">LIMIT</option>
        </select>
        <input name="quantity" type="number" step="0.0001" defaultValue="0.01" className="input" />
        <input name="leverage" type="number" min="1" max="20" defaultValue="3" className="input" />
        <input name="takeProfit" type="number" step="0.0001" placeholder="Take profit" className="input" />
        <input name="stopLoss" type="number" step="0.0001" placeholder="Stop loss" className="input" />
        <input name="reason" placeholder="Reason / thesis" className="input md:col-span-2" />
      </div>
      <button className="button-primary" disabled={order.state.pending}>
        {order.state.pending ? "Placing..." : "Place paper order"}
      </button>
      {order.state.message ? <p className="text-sm text-zinc-300">{order.state.message}</p> : null}
    </form>
  );
}

export function AiSettingsForm({
  initial,
}: {
  initial?: {
    baseUrl?: string;
    model?: string;
    systemPrompt?: string;
    maxPositionUsd?: number;
    riskLimits?: { maxLeverage?: number; dailyLossLimitUsd?: number };
  } | null;
}) {
  const api = useApiForm();

  return (
    <form
      className="space-y-3"
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
      <input name="baseUrl" defaultValue={initial?.baseUrl ?? "https://api.openai.com/v1"} className="input" />
      <input name="apiKey" type="password" placeholder="API key" className="input" />
      <input name="model" defaultValue={initial?.model ?? "gpt-4.1-mini"} className="input" />
      <textarea
        name="systemPrompt"
        defaultValue={
          initial?.systemPrompt ??
          "Use exchange notices, market dislocations, and recent news to generate one conservative paper trading intent."
        }
        className="input min-h-32"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input name="maxPositionUsd" type="number" defaultValue={initial?.maxPositionUsd ?? 100} className="input" />
        <input
          name="maxLeverage"
          type="number"
          defaultValue={initial?.riskLimits?.maxLeverage ?? 3}
          className="input"
        />
        <input
          name="dailyLossLimitUsd"
          type="number"
          defaultValue={initial?.riskLimits?.dailyLossLimitUsd ?? 500}
          className="input"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input name="enabled" type="checkbox" />
        Enable AI auto-execution for paper trading
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? "Saving..." : "Save AI settings"}
      </button>
      {api.state.message ? <p className="text-sm text-zinc-300">{api.state.message}</p> : null}
    </form>
  );
}

export function AdminConfigForm({
  initial,
}: {
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
  const api = useApiForm();

  return (
    <form
      className="space-y-3"
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
        <input name="siteName" defaultValue={initial?.siteName ?? "Crypto Intel Papertrade"} className="input" />
        <select name="defaultLocale" defaultValue={initial?.defaultLocale ?? "zh-CN"} className="input">
          <option value="zh-CN">zh-CN</option>
          <option value="en-US">en-US</option>
        </select>
        <input name="smtpHost" defaultValue={initial?.smtpHost ?? ""} className="input" />
        <input name="smtpPort" type="number" defaultValue={initial?.smtpPort ?? 587} className="input" />
        <input name="smtpUser" defaultValue={initial?.smtpUser ?? ""} className="input" />
        <input name="smtpPassword" type="password" placeholder="SMTP password" className="input" />
        <input name="smtpFromEmail" defaultValue={initial?.smtpFromEmail ?? ""} className="input" />
        <input name="smtpFromName" defaultValue={initial?.smtpFromName ?? "Crypto Intel"} className="input" />
        <input name="githubOwner" defaultValue={initial?.githubOwner ?? ""} className="input" />
        <input name="githubRepo" defaultValue={initial?.githubRepo ?? "crypto-intel-papertrade"} className="input" />
        <input name="ghcrImage" defaultValue={initial?.ghcrImage ?? ""} className="input" />
        <input name="updateChannel" defaultValue={initial?.updateChannel ?? "main"} className="input" />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input name="maintenanceMode" type="checkbox" defaultChecked={initial?.maintenanceMode ?? false} />
        Maintenance mode
      </label>
      <button className="button-primary" disabled={api.state.pending}>
        {api.state.pending ? "Saving..." : "Save admin config"}
      </button>
      {api.state.message ? <p className="text-sm text-zinc-300">{api.state.message}</p> : null}
    </form>
  );
}

export function UpdateTriggerButton() {
  const api = useApiForm();

  return (
    <div className="space-y-3">
      <button
        className="button-primary"
        disabled={api.state.pending}
        onClick={() => {
          api.submit("/api/admin/update", {});
        }}
      >
        {api.state.pending ? "Updating..." : "Run update.sh"}
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
