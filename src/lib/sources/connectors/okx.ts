import WebSocket from "ws";

import { env } from "@/lib/env";
import { parseOkxInstrument } from "@/lib/market/normalize";
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
  volCcy24h?: string;
  open24h?: string;
  high24h?: string;
  low24h?: string;
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

async function fetchOkxTickers(instType: "SPOT" | "SWAP") {
  const response = await fetch(`${env.OKX_API_URL}/api/v5/market/tickers?instType=${instType}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OKX ${instType} tickers`);
  }

  const data = (await response.json()) as {
    data?: OkxTicker[];
  };

  return data.data ?? [];
}

function toSnapshot(item: OkxTicker): MarketSnapshotInput {
  const parsed = parseOkxInstrument(item.instId);
  const last = Number(item.last);
  const open24h = item.open24h ? Number(item.open24h) : item.sodUtc0 ? Number(item.sodUtc0) : last;

  return {
    exchange: "OKX",
    marketType: parsed.marketType,
    instrument: parsed.instrument,
    displaySymbol: parsed.displaySymbol,
    baseAsset: parsed.baseAsset,
    quoteAsset: parsed.quoteAsset,
    bid: Number(item.bidPx),
    ask: Number(item.askPx),
    last,
    volume24h: Number(item.vol24h),
    quoteVolume24h: item.volCcy24h ? Number(item.volCcy24h) : undefined,
    open24h,
    high24h: item.high24h ? Number(item.high24h) : undefined,
    low24h: item.low24h ? Number(item.low24h) : undefined,
    priceChangePercent24h: open24h === 0 ? 0 : ((last - open24h) / open24h) * 100,
    metadata: {
      source: "okx-tickers",
      instId: item.instId,
    },
  };
}

export class OkxConnector {
  private socket?: WebSocket;

  async start(onSnapshot: (snapshot: MarketSnapshotInput) => void) {
    const [spotInstruments, swapInstruments, spotTickers, swapTickers] = await Promise.all([
      fetchOkxInstruments("SPOT"),
      fetchOkxInstruments("SWAP"),
      fetchOkxTickers("SPOT"),
      fetchOkxTickers("SWAP"),
    ]);

    [...spotTickers, ...swapTickers].forEach((item) => {
      onSnapshot(toSnapshot(item));
    });

    const instruments = [...spotInstruments, ...swapInstruments];
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
