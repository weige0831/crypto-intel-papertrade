import WebSocket from "ws";

import { env } from "@/lib/env";
import { normalizeBinanceSymbol } from "@/lib/market/normalize";
import type { MarketSnapshotInput } from "@/lib/sources/types";

type BinanceMiniTicker = {
  s: string;
  c: string;
  o: string;
  v: string;
  P?: string;
};

export class BinanceConnector {
  private socket?: WebSocket;

  start(onSnapshot: (snapshot: MarketSnapshotInput) => void) {
    this.socket = new WebSocket(env.BINANCE_WS_URL);

    this.socket.on("message", (payload) => {
      try {
        const data = JSON.parse(payload.toString()) as BinanceMiniTicker[];

        data.forEach((item) => {
          const last = Number(item.c);
          const open = Number(item.o);
          const priceChangePercent24h = item.P ? Number(item.P) : ((last - open) / open) * 100;

          onSnapshot({
            exchange: "BINANCE",
            instrument: normalizeBinanceSymbol(item.s),
            last,
            volume24h: Number(item.v),
            priceChangePercent24h,
            metadata: {
              source: "miniTicker",
            },
          });
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
