import WebSocket from "ws";

import { env } from "@/lib/env";
import { normalizeOkxSymbol } from "@/lib/market/normalize";
import type { MarketSnapshotInput } from "@/lib/sources/types";
import { sleep } from "@/lib/utils";

type OkxInstrument = {
  instId: string;
};

type OkxTicker = {
  instId: string;
  last: string;
  bidPx: string;
  askPx: string;
  vol24h: string;
  sodUtc0?: string;
};

async function fetchOkxInstruments(instType: "SPOT" | "SWAP") {
  const response = await fetch(`${env.OKX_API_URL}/api/v5/public/instruments?instType=${instType}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OKX ${instType} instruments`);
  }

  const data = (await response.json()) as {
    data?: OkxInstrument[];
  };

  return data.data ?? [];
}

export class OkxConnector {
  private socket?: WebSocket;

  async start(onSnapshot: (snapshot: MarketSnapshotInput) => void) {
    const instruments = await Promise.all([fetchOkxInstruments("SPOT"), fetchOkxInstruments("SWAP")]).then((items) =>
      items.flat(),
    );

    this.socket = new WebSocket(env.OKX_WS_URL);

    this.socket.on("open", async () => {
      const chunks: OkxInstrument[][] = [];

      for (let index = 0; index < instruments.length; index += 20) {
        chunks.push(instruments.slice(index, index + 20));
      }

      for (const chunk of chunks) {
        this.socket?.send(
          JSON.stringify({
            op: "subscribe",
            args: chunk.map((item) => ({
              channel: "tickers",
              instId: item.instId,
            })),
          }),
        );
        await sleep(120);
      }
    });

    this.socket.on("message", (payload) => {
      try {
        const data = JSON.parse(payload.toString()) as {
          arg?: { channel?: string };
          data?: OkxTicker[];
        };

        if (data.arg?.channel !== "tickers") {
          return;
        }

        data.data?.forEach((item) => {
          const last = Number(item.last);
          const open = item.sodUtc0 ? Number(item.sodUtc0) : last;
          const priceChangePercent24h = open === 0 ? 0 : ((last - open) / open) * 100;

          onSnapshot({
            exchange: "OKX",
            instrument: normalizeOkxSymbol(item.instId),
            bid: Number(item.bidPx),
            ask: Number(item.askPx),
            last,
            volume24h: Number(item.vol24h),
            priceChangePercent24h,
            metadata: {
              source: "tickers",
              instId: item.instId,
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
