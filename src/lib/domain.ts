import { z } from "zod";

import { RUNTIME_EVENT_TYPES } from "@/lib/constants";

export const emailCodeRequestSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD"]).default("REGISTER"),
  locale: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(40).optional(),
  code: z.string().min(4).max(8),
  locale: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    code: z.string().min(4).max(8),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const aiSettingsSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  systemPrompt: z.string().min(16),
  maxPositionUsd: z.coerce.number().positive().max(100000),
  enabled: z.coerce.boolean().default(false),
  allowedMarkets: z.array(z.enum(["SPOT", "PERPETUAL"])).min(1),
  maxLeverage: z.coerce.number().min(1).max(20).default(3),
  dailyLossLimitUsd: z.coerce.number().min(0).max(100000).default(500),
});

export const adminConfigSchema = z.object({
  siteName: z.string().min(3),
  defaultLocale: z.enum(["zh-CN", "en-US"]),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.string().optional(),
  smtpFromName: z.string().optional(),
  githubOwner: z.string().min(1),
  githubRepo: z.string().min(1),
  ghcrImage: z.string().min(1),
  updateChannel: z.string().min(1),
  maintenanceMode: z.coerce.boolean().default(false),
});

export const orderRequestSchema = z.object({
  exchange: z.string().default("SIMULATED"),
  portfolioId: z.string().min(1),
  instrument: z.string().min(3),
  marketType: z.enum(["SPOT", "PERPETUAL"]),
  side: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MARKET", "LIMIT", "STOP_MARKET", "STOP_LIMIT"]),
  quantity: z.coerce.number().positive(),
  limitPrice: z.coerce.number().positive().optional(),
  stopPrice: z.coerce.number().positive().optional(),
  leverage: z.coerce.number().min(1).max(20).default(1),
  marginMode: z.enum(["CROSS", "ISOLATED"]).default("ISOLATED"),
  takeProfit: z.coerce.number().positive().optional(),
  stopLoss: z.coerce.number().positive().optional(),
  reduceOnly: z.coerce.boolean().default(false),
  reason: z.string().max(500).optional(),
  source: z.string().default("manual"),
});

export const tradeIntentSchema = z.object({
  instrument: z.string().min(3),
  marketType: z.enum(["SPOT", "PERPETUAL"]),
  side: z.enum(["BUY", "SELL"]),
  orderType: z.enum(["MARKET", "LIMIT", "STOP_MARKET", "STOP_LIMIT"]),
  size: z.coerce.number().positive(),
  leverage: z.coerce.number().min(1).max(20).default(1),
  tp: z.coerce.number().positive().optional(),
  sl: z.coerce.number().positive().optional(),
  thesis: z.string().min(16),
  confidence: z.coerce.number().min(0).max(1),
});

export const runtimeEventSchema = z.object({
  type: z.enum(RUNTIME_EVENT_TYPES),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

export type TradeIntent = z.infer<typeof tradeIntentSchema>;
export type RuntimeEvent = z.infer<typeof runtimeEventSchema>;
