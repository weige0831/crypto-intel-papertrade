export type MarketSnapshotInput = {
  exchange: string;
  instrument: string;
  bid?: number;
  ask?: number;
  last?: number;
  volume24h?: number;
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
