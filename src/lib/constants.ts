export const APP_LOCALES = ["zh-CN", "en-US"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const SESSION_COOKIE = "cip_session";

export const RUNTIME_EVENT_TYPES = [
  "market_tick",
  "market_alert",
  "announcement",
  "news_item",
  "ai_signal",
  "order_fill",
  "position_update",
  "system_update_status",
] as const;

export type RuntimeEventType = (typeof RUNTIME_EVENT_TYPES)[number];

export const DEFAULT_USER_PROMPT =
  "Use exchange notices, breaking news, and volatility to form cautious paper trading decisions. Output only structured JSON and stay within configured risk limits.";

export const REDIS_EVENT_CHANNEL = "crypto-intel:events";
