const QUOTE_ASSETS = ["USDT", "USDC", "BUSD", "FDUSD", "BTC", "ETH", "USD"];

export function canonicalInstrument(symbol: string) {
  return symbol.replace(/[-_/]/g, "").toUpperCase();
}

export function normalizeBinanceSymbol(symbol: string) {
  return canonicalInstrument(symbol);
}

export function normalizeOkxSymbol(symbol: string) {
  return symbol.replace(/-/g, "").toUpperCase();
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

export function extractSymbolsFromText(input: string) {
  const matches = input.match(/\b[A-Z]{2,10}(?:USDT|USDC|BTC|ETH|USD)\b/g) ?? [];
  return [...new Set(matches.map(canonicalInstrument))];
}
