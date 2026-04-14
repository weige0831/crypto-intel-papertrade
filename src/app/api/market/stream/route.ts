import { canonicalInstrument, splitInstrument } from "@/lib/market/normalize";
import { getLocalRuntimeEvents, subscribeRuntimeEvents } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

function includesInstrument(payload: Record<string, unknown>, requested?: string) {
  if (!requested) {
    return true;
  }

  const canonical = canonicalInstrument(requested);
  const base = splitInstrument(canonical).base;
  const direct = String(payload.instrument ?? payload.symbol ?? "").toUpperCase();

  if (direct && canonicalInstrument(direct) === canonical) {
    return true;
  }

  const symbols = Array.isArray(payload.symbols) ? payload.symbols.map((value) => String(value).toUpperCase()) : [];
  if (symbols.some((value) => canonicalInstrument(value) === canonical)) {
    return true;
  }

  const text = `${String(payload.title ?? "")} ${String(payload.summary ?? "")}`.toUpperCase();
  return text.includes(canonical) || text.includes(base);
}

function shouldIncludeEvent(
  event: { type: string; payload: Record<string, unknown> },
  mode: "intel" | "all",
  instrument?: string,
) {
  if (mode === "intel") {
    const intelTypes = new Set(["announcement", "news_item", "ai_signal", "market_alert", "system_update_status"]);
    if (!intelTypes.has(event.type)) {
      return false;
    }
  }

  return includesInstrument(event.payload, instrument);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "all" ? "all" : "intel";
  const instrument = url.searchParams.get("instrument") ?? undefined;
  const encoder = new TextEncoder();
  let unsubscribe: (() => Promise<void>) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const write = (message: string) => controller.enqueue(encoder.encode(message));

      getLocalRuntimeEvents()
        .slice()
        .reverse()
        .filter((event) => shouldIncludeEvent(event, mode, instrument))
        .forEach((event) => write(`data: ${JSON.stringify(event)}\n\n`));

      unsubscribe = await subscribeRuntimeEvents((event) => {
        if (!shouldIncludeEvent(event, mode, instrument)) {
          return;
        }
        write(`data: ${JSON.stringify(event)}\n\n`);
      });

      heartbeat = setInterval(() => {
        write(`: ping ${Date.now()}\n\n`);
      }, 15000);
    },
    async cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      if (unsubscribe) {
        await unsubscribe();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
