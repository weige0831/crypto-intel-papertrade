import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("Crypto Intel Papertrade"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DEFAULT_LOCALE: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/crypto_intel?schema=public"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().default("crypto-intel-papertrade-auth-secret"),
  APP_ENCRYPTION_KEY: z.string().default("crypto-intel-papertrade-encryption-key"),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  ADMIN_PASSWORD: z.string().optional().or(z.literal("")),
  BINANCE_WS_URL: z.string().default("wss://stream.binance.com:9443/ws/!ticker@arr"),
  BINANCE_API_URL: z.string().default("https://api.binance.com"),
  OKX_WS_URL: z.string().default("wss://ws.okx.com:8443/ws/v5/public"),
  OKX_API_URL: z.string().default("https://www.okx.com"),
  OPENAI_COMPAT_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENAI_COMPAT_API_KEY: z.string().optional().or(z.literal("")),
  OPENAI_COMPAT_MODEL: z.string().default("gpt-4.1-mini"),
  SMTP_HOST: z.string().optional().or(z.literal("")),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().or(z.literal("")),
  SMTP_PASSWORD: z.string().optional().or(z.literal("")),
  SMTP_FROM_EMAIL: z.string().optional().or(z.literal("")),
  SMTP_FROM_NAME: z.string().default("Crypto Intel"),
  GITHUB_OWNER: z.string().default("weige0831"),
  GITHUB_REPO: z.string().default("crypto-intel-papertrade"),
  GHCR_IMAGE: z.string().default("ghcr.io/weige0831/crypto-intel-papertrade"),
  UPDATE_CHANNEL: z.string().default("main"),
  UPDATE_SCRIPT_PATH: z.string().default("./scripts/update.sh"),
  ALLOW_SYSTEM_UPDATE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
