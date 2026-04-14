import { createClient } from "redis";

import { REDIS_EVENT_CHANNEL } from "@/lib/constants";
import { env } from "@/lib/env";
import type { RuntimeEvent } from "@/lib/domain";

const globalForEvents = globalThis as unknown as {
  redisPublisher?: Promise<ReturnType<typeof createClient>>;
  runtimeEvents?: RuntimeEvent[];
};

async function getPublisher() {
  if (!globalForEvents.redisPublisher) {
    globalForEvents.redisPublisher = (async () => {
      const client = createClient({ url: env.REDIS_URL });
      client.on("error", () => undefined);
      await client.connect();
      return client;
    })();
  }

  return globalForEvents.redisPublisher;
}

function pushLocalEvent(event: RuntimeEvent) {
  if (!globalForEvents.runtimeEvents) {
    globalForEvents.runtimeEvents = [];
  }

  globalForEvents.runtimeEvents.unshift(event);
  globalForEvents.runtimeEvents = globalForEvents.runtimeEvents.slice(0, 100);
}

export function getLocalRuntimeEvents() {
  return globalForEvents.runtimeEvents ?? [];
}

export async function publishRuntimeEvent(event: RuntimeEvent) {
  pushLocalEvent(event);

  try {
    const publisher = await getPublisher();
    await publisher.publish(REDIS_EVENT_CHANNEL, JSON.stringify(event));
  } catch {
    return;
  }
}

export async function subscribeRuntimeEvents(onEvent: (event: RuntimeEvent) => void) {
  try {
    const client = createClient({ url: env.REDIS_URL });
    client.on("error", () => undefined);
    await client.connect();
    await client.subscribe(REDIS_EVENT_CHANNEL, (message) => {
      try {
        onEvent(JSON.parse(message) as RuntimeEvent);
      } catch {
        return;
      }
    });

    return async () => {
      await client.disconnect();
    };
  } catch {
    return async () => undefined;
  }
}
