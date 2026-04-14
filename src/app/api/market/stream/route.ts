import { getLocalRuntimeEvents, subscribeRuntimeEvents } from "@/lib/server/bus";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => Promise<void>) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const write = (message: string) => controller.enqueue(encoder.encode(message));

      getLocalRuntimeEvents()
        .slice()
        .reverse()
        .forEach((event) => write(`data: ${JSON.stringify(event)}\n\n`));

      unsubscribe = await subscribeRuntimeEvents((event) => {
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
