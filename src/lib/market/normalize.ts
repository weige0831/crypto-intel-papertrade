import { type MarketType } from "@prisma/client";

const QUOTE_ASSETS = ["USDT", "USDC", "FDUSD", "BUSD", "BTC", "ETH", "USD"];

export type ParsedInstrument = {
  instrument: string;
  displaySymbol: string;
  baseAsset: string;
  quoteAsset: string;
  marketType: MarketType;
};

export function canonicalInstrument(symbol: string) {
  return symbol.replace(/[-_/]/g, "").replace(/SWAP$/i, "").toUpperCase();
}

export function detectQuoteAsset(symbol: string) {
  const instrument = canonicalInstrument(symbol);
  const found = QUOTE_ASSETS.find((asset) => instrument.endsWith(asset));
  return found ?? "USD";
}

export function splitInstrument(symbol: string) {
  const instrument = canonicalInstrument(symbol);
  const quote = detectQuoteAsset(instrument);
  return {
    base: instrument.slice(0, instrument.length - quote.length),
    quote,
  };
}

export function parseBinanceSymbol(symbol: string): ParsedInstrument {
  const displaySymbol = symbol.toUpperCase();
  const normalized = canonicalInstrument(displaySymbol);
  const { base, quote } = splitInstrument(normalized);

  return {
    instrument: normalized,
    displaySymbol,
    baseAsset: base,
    quoteAsset: quote,
    marketType: "SPOT",
  };
}

export function normalizeBinanceSymbol(symbol: string) {
  return parseBinanceSymbol(symbol).instrument;
}

export function parseOkxInstrument(instId: string): ParsedInstrument {
  const upper = instId.toUpperCase();
  const parts = upper.split("-");

  if (parts.length >= 3 && parts.at(-1) === "SWAP") {
    const [baseAsset, quoteAsset] = parts;
    return {
      instrument: `${baseAsset}${quoteAsset}`,
      displaySymbol: `${baseAsset}-${quoteAsset}-SWAP`,
      baseAsset,
      quoteAsset,
      marketType: "PERPETUAL",
    };
  }

  const [baseAsset = "", quoteAsset = detectQuoteAsset(upper)] = parts;
  return {
    instrument: `${baseAsset}${quoteAsset}`,
    displaySymbol: `${baseAsset}-${quoteAsset}`,
    baseAsset,
    quoteAsset,
    marketType: "SPOT",
  };
}

export function normalizeOkxSymbol(symbol: string) {
  return parseOkxInstrument(symbol).instrument;
}

export function extractSymbolsFromText(input: string) {
  const matches = input.match(/\b[A-Z]{2,12}(?:USDT|USDC|FDUSD|BUSD|BTC|ETH|USD)\b/g) ?? [];
  return [...new Set(matches.map(canonicalInstrument))];
}

export function buildTradingViewSymbol(input: {
  exchange: string;
  instrument: string;
  marketType: MarketType;
}) {
  const instrument = canonicalInstrument(input.instrument);

  if (input.exchange === "BINANCE" && input.marketType === "SPOT") {
    return `BINANCE:${instrument}`;
  }

  if (input.exchange === "OKX" && input.marketType === "SPOT") {
    return `OKX:${instrument}`;
  }

  return null;
}
