import { describe, expect, it } from "vitest";

import { detectQuoteAsset, extractSymbolsFromText, normalizeBinanceSymbol, normalizeOkxSymbol, splitInstrument } from "@/lib/market/normalize";

describe("market normalization", () => {
  it("normalizes Binance symbols", () => {
    expect(normalizeBinanceSymbol("btcusdt")).toBe("BTCUSDT");
  });

  it("normalizes OKX symbols", () => {
    expect(normalizeOkxSymbol("BTC-USDT")).toBe("BTCUSDT");
  });

  it("detects base and quote", () => {
    expect(splitInstrument("ETHUSDT")).toEqual({ base: "ETH", quote: "USDT" });
    expect(detectQuoteAsset("SOLUSDC")).toBe("USDC");
  });

  it("extracts tradable symbols from text", () => {
    expect(extractSymbolsFromText("Watch BTCUSDT and ETHUSDT listing momentum")).toEqual(["BTCUSDT", "ETHUSDT"]);
  });
});
