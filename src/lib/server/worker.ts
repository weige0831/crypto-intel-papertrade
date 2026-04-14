import { Prisma } from "@prisma/client";

import { clampTradeIntent, requestTradeIntent } from "@/lib/ai/executor";
import { runtimeEventSchema } from "@/lib/domain";
import { env } from "@/lib/env";
import { buildMarketAlert } from "@/lib/market/alerts";
import { canonicalInstrument } from "@/lib/market/normalize";
import { prisma } from "@/lib/prisma";
import { publishRuntimeEvent } from "@/lib/server/bus";
import { markPositionsToMarket, liquidateBrokenPositions, settleFundingForOpenPositions, submitPaperOrder } from "@/lib/server/trading";
import { collectIntelFeeds } from "@/lib/sources/announcements";
import { BinanceConnector } from "@/lib/sources/connectors/binance";
import { OkxConnector } from "@/lib/sources/connectors/okx";
import type { IntelItem, MarketSnapshotInput } from "@/lib/sources/types";

async function persistSnapshot(snapshot: MarketSnapshotInput) {
  const previous = await prisma.marketSnapshot.findUnique({
    where: {
      exchange_instrument: {
        exchange: snapshot.exchange,
        instrument: canonicalInstrument(snapshot.instrument),
      },
    },
  });

  await prisma.marketSnapshot.upsert({
    where: {
      exchange_instrument: {
        exchange: snapshot.exchange,
        instrument: canonicalInstrument(snapshot.instrument),
      },
    },
    update: {
      bid: snapshot.bid,
      ask: snapshot.ask,
      last: snapshot.last,
      volume24h: snapshot.volume24h,
      priceChangePercent24h: snapshot.priceChangePercent24h,
      metadata: snapshot.metadata as Prisma.InputJsonValue,
      observedAt: new Date(),
    },
    create: {
      exchange: snapshot.exchange,
      instrument: canonicalInstrument(snapshot.instrument),
      bid: snapshot.bid,
      ask: snapshot.ask,
      last: snapshot.last,
      volume24h: snapshot.volume24h,
      priceChangePercent24h: snapshot.priceChangePercent24h,
      metadata: snapshot.metadata as Prisma.InputJsonValue,
    },
  });

  await publishRuntimeEvent(
    runtimeEventSchema.parse({
      type: "market_tick",
      payload: {
        exchange: snapshot.exchange,
        instrument: canonicalInstrument(snapshot.instrument),
        last: snapshot.last,
        bid: snapshot.bid,
        ask: snapshot.ask,
        volume24h: snapshot.volume24h,
        priceChangePercent24h: snapshot.priceChangePercent24h,
      },
      createdAt: new Date().toISOString(),
    }),
  );

  if (previous?.last && snapshot.last) {
    const alert = buildMarketAlert({
      instrument: snapshot.instrument,
      lastPrice: snapshot.last,
      previousPrice: previous.last,
      volume24h: snapshot.volume24h,
      spreadPercent:
        snapshot.ask && snapshot.bid && snapshot.last
          ? ((snapshot.ask - snapshot.bid) / snapshot.last) * 100
          : 0,
    });

    if (alert.severity !== "low") {
      await publishRuntimeEvent(
        runtimeEventSchema.parse({
          type: "market_alert",
          payload: alert,
          createdAt: new Date().toISOString(),
        }),
      );
    }
  }
}

async function persistIntelItem(item: IntelItem) {
  if (!item.url) {
    return;
  }

  if (item.sourceType === "EXCHANGE") {
    const announcement = await prisma.announcement.upsert({
      where: { url: item.url },
      update: {
        title: item.title,
        summary: item.summary,
        symbols: item.symbols as Prisma.InputJsonValue,
        publishedAt: item.publishedAt,
        category: item.category,
      },
      create: {
        exchange: item.sourceName.toUpperCase(),
        title: item.title,
        summary: item.summary,
        url: item.url,
        symbols: item.symbols as Prisma.InputJsonValue,
        publishedAt: item.publishedAt,
        category: item.category,
      },
    });

    await publishRuntimeEvent(
      runtimeEventSchema.parse({
        type: "announcement",
        payload: {
          id: announcement.id,
          exchange: announcement.exchange,
          title: announcement.title,
          url: announcement.url,
          symbols: announcement.symbols ?? [],
        },
        createdAt: new Date().toISOString(),
      }),
    );
    return;
  }

  const news = await prisma.newsItem.upsert({
    where: { url: item.url },
    update: {
      title: item.title,
      summary: item.summary,
      language: item.language ?? "en-US",
      symbols: item.symbols as Prisma.InputJsonValue,
      category: item.category,
      publishedAt: item.publishedAt,
    },
    create: {
      sourceName: item.sourceName,
      sourceType: item.sourceType,
      title: item.title,
      summary: item.summary,
      url: item.url,
      language: item.language ?? "en-US",
      symbols: item.symbols as Prisma.InputJsonValue,
      category: item.category,
      publishedAt: item.publishedAt,
    },
  });

  await publishRuntimeEvent(
    runtimeEventSchema.parse({
      type: "news_item",
      payload: {
        id: news.id,
        sourceName: news.sourceName,
        title: news.title,
        url: news.url,
        symbols: news.symbols ?? [],
      },
      createdAt: new Date().toISOString(),
    }),
  );
}

async function runIntelCycle() {
  const intel = await collectIntelFeeds();
  await Promise.all(intel.map((item) => persistIntelItem(item)));
}

async function runAiCycle() {
  const configs = await prisma.aiProviderConfig.findMany({
    where: {
      scope: "USER",
      isEnabled: true,
      userId: { not: null },
    },
    include: {
      user: true,
    },
  });

  for (const config of configs) {
    try {
      const [marketContext, newsContext] = await Promise.all([
        prisma.marketSnapshot.findMany({
          take: 12,
          orderBy: { volume24h: "desc" },
        }),
        prisma.newsItem.findMany({
          take: 12,
          orderBy: { discoveredAt: "desc" },
        }),
      ]);

      const limits = {
        maxPositionUsd: config.maxPositionUsd,
        maxLeverage: Number((config.riskLimits as Record<string, unknown> | null)?.maxLeverage ?? 3),
        dailyLossLimitUsd: Number((config.riskLimits as Record<string, unknown> | null)?.dailyLossLimitUsd ?? 500),
      };

      const decision = await requestTradeIntent({
        baseUrl: config.baseUrl || env.OPENAI_COMPAT_BASE_URL,
        apiKeyEncrypted: config.apiKeyEnc,
        model: config.model,
        systemPrompt: config.systemPrompt,
        marketContext,
        newsContext,
        riskLimits: limits,
      });

      const normalized = clampTradeIntent(decision.normalizedSignal, limits);

      const execution = await submitPaperOrder(config.userId!, {
        portfolioId: "worker",
        exchange: "SIMULATED",
        instrument: normalized.instrument,
        marketType: normalized.marketType,
        side: normalized.side,
        orderType: normalized.orderType,
        quantity: normalized.size,
        leverage: normalized.leverage,
        takeProfit: normalized.tp,
        stopLoss: normalized.sl,
        source: "ai",
        reason: normalized.thesis,
      });

      const log = await prisma.aiDecisionLog.create({
        data: {
          userId: config.userId!,
          providerConfigId: config.id,
          instrument: normalized.instrument,
          marketType: normalized.marketType,
          promptDigest: decision.promptDigest,
          rawSignal: decision.rawSignal as Prisma.InputJsonValue,
          normalizedSignal: normalized as Prisma.InputJsonValue,
          executionStatus: execution.ok ? "EXECUTED" : "REJECTED",
          rejectionReason: execution.ok ? null : execution.reason,
        },
      });

      await publishRuntimeEvent(
        runtimeEventSchema.parse({
          type: "ai_signal",
          payload: {
            decisionId: log.id,
            instrument: normalized.instrument,
            marketType: normalized.marketType,
            side: normalized.side,
            confidence: normalized.confidence,
            thesis: normalized.thesis,
            executionStatus: log.executionStatus,
          },
          createdAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown AI execution error";
      console.error("[worker][ai-cycle]", message);
    }
  }
}

async function start() {
  console.info("[worker] starting");

  const binance = new BinanceConnector();
  const okx = new OkxConnector();

  binance.start((snapshot) => {
    persistSnapshot(snapshot).catch((error) => console.error("[worker][binance]", error));
  });

  okx
    .start((snapshot) => {
      persistSnapshot(snapshot).catch((error) => console.error("[worker][okx]", error));
    })
    .catch((error) => console.error("[worker][okx-start]", error));

  await runIntelCycle().catch((error) => console.error("[worker][intel-initial]", error));
  await markPositionsToMarket().catch((error) => console.error("[worker][mark-initial]", error));

  setInterval(() => {
    runIntelCycle().catch((error) => console.error("[worker][intel]", error));
  }, 1000 * 60 * 5);

  setInterval(() => {
    runAiCycle().catch((error) => console.error("[worker][ai]", error));
  }, 1000 * 90);

  setInterval(() => {
    markPositionsToMarket()
      .then(() => liquidateBrokenPositions())
      .catch((error) => console.error("[worker][risk-loop]", error));
  }, 1000 * 30);

  setInterval(() => {
    settleFundingForOpenPositions().catch((error) => console.error("[worker][funding]", error));
  }, 1000 * 60 * 30);
}

start().catch((error) => {
  console.error("[worker] fatal", error);
  process.exitCode = 1;
});
