import { createHash } from "node:crypto";

import { decryptSecret } from "@/lib/crypto";
import { tradeIntentSchema, type TradeIntent } from "@/lib/domain";

type AiExecutionInput = {
  baseUrl: string;
  apiKeyEncrypted: string;
  model: string;
  systemPrompt: string;
  marketContext: unknown;
  newsContext: unknown;
  riskLimits: {
    maxPositionUsd: number;
    maxLeverage: number;
    dailyLossLimitUsd: number;
  };
};

function parseJsonFromResponse(content: string) {
  const codeBlock = content.match(/```json\s*([\s\S]+?)```/i);
  const raw = codeBlock?.[1] ?? content;
  return JSON.parse(raw);
}

export async function requestTradeIntent(input: AiExecutionInput) {
  const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${decryptSecret(input.apiKeyEncrypted)}`,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Generate a single trade intent for a paper trading platform.",
            riskLimits: input.riskLimits,
            marketContext: input.marketContext,
            newsContext: input.newsContext,
            outputSchema: {
              instrument: "string",
              marketType: "SPOT | PERPETUAL",
              side: "BUY | SELL",
              orderType: "MARKET | LIMIT | STOP_MARKET | STOP_LIMIT",
              size: "number",
              leverage: "number",
              tp: "number | null",
              sl: "number | null",
              thesis: "string",
              confidence: "number 0..1",
            },
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI response did not contain message content");
  }

  const rawSignal = parseJsonFromResponse(content);
  const normalizedSignal = tradeIntentSchema.parse(rawSignal);

  return {
    rawSignal,
    normalizedSignal,
    promptDigest: createHash("sha256")
      .update(JSON.stringify({ marketContext: input.marketContext, newsContext: input.newsContext }))
      .digest("hex"),
  };
}

export function clampTradeIntent(intent: TradeIntent, riskLimits: AiExecutionInput["riskLimits"]): TradeIntent {
  return {
    ...intent,
    size: Math.min(intent.size, riskLimits.maxPositionUsd),
    leverage: Math.min(intent.leverage, riskLimits.maxLeverage),
  };
}
