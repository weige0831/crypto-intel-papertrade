import { canonicalInstrument } from "@/lib/market/normalize";

export type AlertSeverity = "low" | "medium" | "high";

export type AlertInput = {
  instrument: string;
  lastPrice: number;
  previousPrice: number;
  volume24h?: number;
  spreadPercent?: number;
};

export function buildMarketAlert(input: AlertInput) {
  const changePercent = ((input.lastPrice - input.previousPrice) / input.previousPrice) * 100;
  const spreadPercent = input.spreadPercent ?? 0;
  const severity: AlertSeverity =
    Math.abs(changePercent) >= 6 || spreadPercent >= 0.8
      ? "high"
      : Math.abs(changePercent) >= 3 || spreadPercent >= 0.4
        ? "medium"
        : "low";

  return {
    instrument: canonicalInstrument(input.instrument),
    changePercent,
    spreadPercent,
    volume24h: input.volume24h ?? 0,
    severity,
    headline:
      changePercent >= 0
        ? `${canonicalInstrument(input.instrument)} momentum breakout`
        : `${canonicalInstrument(input.instrument)} downside acceleration`,
  };
}
