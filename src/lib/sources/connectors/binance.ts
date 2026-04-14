import WebSocket from "ws";

import { env } from "@/lib/env";
import { parseBinanceSymbol } from "@/lib/market/normalize";
import type { MarketSnapshotInput } from "@/lib/sources/types";

type BinanceTicker = {
  s: string;
  b?: string;
  a?: string;
  c: string;
  o: string;
  h?: string;
  l?: string;
  v: string;
  q?: string;
  P?: string;
};

async function fetchBinanceTickers() {
  const response = await fetch(`${env.BINANCE_API_URL}/api/v3/ticker/24hr`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Binance 24hr tickers");
  }

  return (await response.json()) as BinanceTicker[];
}

function toSnapshot(item: BinanceTicker): MarketSnapshotInput {
  const parsed = parseBinanceSymbol(item.s);
  const last = Number(item.c);
  const open24h = Number(item.o);

  return {
    exchange: "BINANCE",
    marketType: parsed.marketType,
    instrument: parsed.instrument,
    displaySymbol: parsed.displaySymbol,
    baseAsset: parsed.baseAsset,
    quoteAsset: parsed.quoteAsset,
    bid: item.b ? Number(item.b) : undefined,
    ask: item.a ? Number(item.a) : undefined,
    last,
    volume24h: Number(item.v),
    quoteVolume24h: item.q ? Number(item.q) : undefined,
    open24h,
    high24h: item.h ? Number(item.h) : undefined,
    low24h: item.l ? Number(item.l) : undefined,
    priceChangePercent24h: item.P ? Number(item.P) : open24h === 0 ? 0 : ((last - open24h) / open24h) * 100,
    metadata: {
      source: "binance-24hr-ticker",
    },
  };
}

export class BinanceConnector {
  private socket?: WebSocket;

  async start(onSnapshot: (snapshot: MarketSnapshotInput) => void) {
    const initialSnapshots = await fetchBinanceTickers();
    initialSnapshots.forEach((item) => onSnapshot(toSnapshot(item)));

    this.socket = new WebSocket(env.BINANCE_WS_URL);

    this.socket.on("message", (payload) => {
      try {
        const raw = JSON.parse(payload.toString()) as BinanceTicker | BinanceTicker[];
        const data = Array.isArray(raw) ? raw : [raw];

        data.forEach((item) => {
          onSnapshot(toSnapshot(item));
        });
      } catch {
        return;
      }
    });

    return () => {
      this.socket?.close();
    };
  }
}
