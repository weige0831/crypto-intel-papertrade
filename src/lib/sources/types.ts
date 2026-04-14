export type MarketSnapshotInput = {
  exchange: string;
  marketType: "SPOT" | "PERPETUAL";
  instrument: string;
  displaySymbol: string;
  baseAsset: string;
  quoteAsset: string;
  bid?: number;
  ask?: number;
  last?: number;
  volume24h?: number;
  quoteVolume24h?: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  priceChangePercent24h?: number;
  metadata?: Record<string, unknown>;
};

export type IntelItem = {
  sourceName: string;
  sourceType: "EXCHANGE" | "RSS" | "API" | "SOCIAL";
  title: string;
  summary?: string;
  url: string;
  language?: string;
  symbols?: string[];
  category?: string;
  publishedAt?: Date;
};
