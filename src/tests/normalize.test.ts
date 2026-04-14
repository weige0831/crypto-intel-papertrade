import { describe, expect, it } from "vitest";

import {
  buildTradingViewSymbol,
  detectQuoteAsset,
  extractSymbolsFromText,
  normalizeBinanceSymbol,
  normalizeOkxSymbol,
  parseOkxInstrument,
  splitInstrument,
} from "@/lib/market/normalize";

describe("market normalization", () => {
  it("normalizes Binance symbols", () => {
    expect(normalizeBinanceSymbol("btcusdt")).toBe("BTCUSDT");
  });

  it("normalizes OKX spot and perpetual symbols", () => {
    expect(normalizeOkxSymbol("BTC-USDT")).toBe("BTCUSDT");
    expect(parseOkxInstrument("BTC-USDT-SWAP")).toEqual({
      instrument: "BTCUSDT",
      displaySymbol: "BTC-USDT-SWAP",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      marketType: "PERPETUAL",
    });
  });

  it("detects base and quote", () => {
    expect(splitInstrument("ETHUSDT")).toEqual({ base: "ETH", quote: "USDT" });
    expect(detectQuoteAsset("SOLUSDC")).toBe("USDC");
  });

  it("extracts tradable symbols from text", () => {
    expect(extractSymbolsFromText("Watch BTCUSDT and ETHUSDT listing momentum")).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("builds TradingView symbols for supported spot venues", () => {
    expect(buildTradingViewSymbol({ exchange: "BINANCE", instrument: "BTCUSDT", marketType: "SPOT" })).toBe("BINANCE:BTCUSDT");
    expect(buildTradingViewSymbol({ exchange: "OKX", instrument: "BTCUSDT", marketType: "SPOT" })).toBe("OKX:BTCUSDT");
    expect(buildTradingViewSymbol({ exchange: "OKX", instrument: "BTCUSDT", marketType: "PERPETUAL" })).toBeNull();
  });
});
