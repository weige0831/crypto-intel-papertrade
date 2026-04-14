import { type MarketSnapshot } from "@prisma/client";

import { type AppLocale } from "@/lib/constants";
import { maskSecret } from "@/lib/crypto";
import { buildTradingViewSymbol, canonicalInstrument, splitInstrument } from "@/lib/market/normalize";
import { prisma } from "@/lib/prisma";
import { niceDate } from "@/lib/utils";

type RankingRow = {
  instrument: string;
  displaySymbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  marketType: "SPOT" | "PERPETUAL";
  last: number | null;
  priceChangePercent24h: number | null;
  quoteVolume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  availableMarkets: number;
  exchanges: string[];
};

type IntelFeedItem = {
  id: string;
  kind: "announcement" | "news";
  sourceLabel: string;
  title: string;
  summary: string | null;
  url: string;
  publishedAt: Date | null;
  symbols: string[];
};

const sampleSnapshots: MarketSnapshot[] = [
  {
    id: "sample-btc-binance",
    exchange: "BINANCE",
    marketType: "SPOT",
    instrument: "BTCUSDT",
    displaySymbol: "BTCUSDT",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    bid: 67390,
    ask: 67430,
    last: 67420,
    volume24h: 4893,
    quoteVolume24h: 329100000,
    open24h: 65800,
    high24h: 68200,
    low24h: 65120,
    priceChangePercent24h: 2.46,
    metadata: {},
    observedAt: new Date(),
  },
  {
    id: "sample-eth-okx",
    exchange: "OKX",
    marketType: "SPOT",
    instrument: "ETHUSDT",
    displaySymbol: "ETH-USDT",
    baseAsset: "ETH",
    quoteAsset: "USDT",
    bid: 3283,
    ask: 3285,
    last: 3284,
    volume24h: 59120,
    quoteVolume24h: 194400000,
    open24h: 3320,
    high24h: 3366,
    low24h: 3254,
    priceChangePercent24h: -1.08,
    metadata: {},
    observedAt: new Date(),
  },
  {
    id: "sample-sol-binance",
    exchange: "BINANCE",
    marketType: "SPOT",
    instrument: "SOLUSDT",
    displaySymbol: "SOLUSDT",
    baseAsset: "SOL",
    quoteAsset: "USDT",
    bid: 171.2,
    ask: 171.6,
    last: 171.4,
    volume24h: 515000,
    quoteVolume24h: 88300000,
    open24h: 162,
    high24h: 174.8,
    low24h: 160.1,
    priceChangePercent24h: 5.8,
    metadata: {},
    observedAt: new Date(),
  },
];

async function withFallback<T>(factory: () => Promise<T>, fallback: T) {
  try {
    return await factory();
  } catch {
    return fallback;
  }
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function snapshotWithDerivedFields(snapshot: MarketSnapshot) {
  const { base, quote } = splitInstrument(snapshot.instrument);

  return {
    ...snapshot,
    displaySymbol: snapshot.displaySymbol ?? snapshot.instrument,
    baseAsset: snapshot.baseAsset ?? base,
    quoteAsset: snapshot.quoteAsset ?? quote,
  };
}

function buildRankings(snapshots: MarketSnapshot[]) {
  const grouped = new Map<string, MarketSnapshot[]>();

  snapshots.forEach((snapshot) => {
    const instrument = canonicalInstrument(snapshot.instrument);
    grouped.set(instrument, [...(grouped.get(instrument) ?? []), snapshotWithDerivedFields(snapshot)]);
  });

  const rows: RankingRow[] = [...grouped.values()].map((group) => {
    const ordered = [...group].sort(
      (left, right) =>
        (right.quoteVolume24h ?? 0) - (left.quoteVolume24h ?? 0) ||
        (right.observedAt?.getTime?.() ?? 0) - (left.observedAt?.getTime?.() ?? 0),
    );
    const lead = ordered[0];

    return {
      instrument: lead.instrument,
      displaySymbol: lead.displaySymbol ?? lead.instrument,
      baseAsset: lead.baseAsset ?? splitInstrument(lead.instrument).base,
      quoteAsset: lead.quoteAsset ?? splitInstrument(lead.instrument).quote,
      exchange: lead.exchange,
      marketType: lead.marketType,
      last: lead.last,
      priceChangePercent24h: lead.priceChangePercent24h,
      quoteVolume24h: lead.quoteVolume24h,
      high24h: lead.high24h,
      low24h: lead.low24h,
      availableMarkets: ordered.length,
      exchanges: [...new Set(ordered.map((item) => `${item.exchange} ${item.marketType}`))],
    };
  });

  return {
    volume: [...rows].sort((left, right) => (right.quoteVolume24h ?? 0) - (left.quoteVolume24h ?? 0)).slice(0, 24),
    movers: [...rows].sort((left, right) => (right.priceChangePercent24h ?? 0) - (left.priceChangePercent24h ?? 0)).slice(0, 24),
    losers: [...rows].sort((left, right) => (left.priceChangePercent24h ?? 0) - (right.priceChangePercent24h ?? 0)).slice(0, 24),
  };
}

function buildIntelFeed(
  announcements: Array<{
    id: string;
    exchange: string;
    title: string;
    summary: string | null;
    url: string;
    publishedAt: Date | null;
    discoveredAt: Date;
    symbols: unknown;
  }>,
  news: Array<{
    id: string;
    sourceName: string;
    title: string;
    summary: string | null;
    url: string;
    publishedAt: Date | null;
    discoveredAt: Date;
    symbols: unknown;
  }>,
) {
  return [
    ...announcements.map((item) => ({
      id: item.id,
      kind: "announcement" as const,
      sourceLabel: item.exchange,
      title: item.title,
      summary: item.summary,
      url: item.url,
      publishedAt: item.publishedAt ?? item.discoveredAt,
      symbols: safeArray<string>(item.symbols).map(canonicalInstrument),
    })),
    ...news.map((item) => ({
      id: item.id,
      kind: "news" as const,
      sourceLabel: item.sourceName,
      title: item.title,
      summary: item.summary,
      url: item.url,
      publishedAt: item.publishedAt ?? item.discoveredAt,
      symbols: safeArray<string>(item.symbols).map(canonicalInstrument),
    })),
  ].sort((left, right) => (right.publishedAt?.getTime?.() ?? 0) - (left.publishedAt?.getTime?.() ?? 0));
}

function filterIntelByInstrument(items: IntelFeedItem[], instrument: string) {
  const canonical = canonicalInstrument(instrument);
  const { base } = splitInstrument(canonical);

  return items.filter((item) => {
    if (item.symbols.includes(canonical)) {
      return true;
    }

    const text = `${item.title} ${item.summary ?? ""}`.toUpperCase();
    return text.includes(canonical) || text.includes(base);
  });
}

export async function getHomeMetrics(locale: AppLocale = "zh-CN") {
  const [marketCount, announcementCount, newsCount, aiCount] = await Promise.all([
    withFallback(() => prisma.marketSnapshot.count(), sampleSnapshots.length),
    withFallback(() => prisma.announcement.count(), 8),
    withFallback(() => prisma.newsItem.count(), 24),
    withFallback(() => prisma.aiDecisionLog.count(), 5),
  ]);

  const labels =
    locale === "zh-CN"
      ? ["跟踪市场", "公告数量", "新闻条目", "AI 决策"]
      : ["Tracked markets", "Announcements", "News items", "AI decisions"];

  return [
    { label: labels[0], value: marketCount.toString() },
    { label: labels[1], value: announcementCount.toString() },
    { label: labels[2], value: newsCount.toString() },
    { label: labels[3], value: aiCount.toString() },
  ];
}

export async function getMarketPageData(locale: AppLocale = "zh-CN") {
  const snapshots = await withFallback(
    () =>
      prisma.marketSnapshot.findMany({
        take: 300,
        orderBy: [{ quoteVolume24h: "desc" }, { observedAt: "desc" }],
      }),
    sampleSnapshots,
  );

  const announcements = await withFallback(
    () =>
      prisma.announcement.findMany({
        take: 12,
        orderBy: [{ publishedAt: "desc" }, { discoveredAt: "desc" }],
      }),
    [
      {
        id: "demo-announcement",
        exchange: "BINANCE",
        title: locale === "zh-CN" ? "演示公告：Worker 启动后这里会显示交易所官方公告" : "Demo notice: official exchange announcements appear after the worker starts",
        summary: locale === "zh-CN" ? "当前展示的是占位数据，接入真实采集后会自动切换。" : "Demo data is shown until live collectors are running.",
        url: "https://example.com/demo-announcement",
        publishedAt: new Date(),
        discoveredAt: new Date(),
        symbols: ["BTCUSDT"],
        category: "announcement",
      },
    ],
  );

  const news = await withFallback(
    () =>
      prisma.newsItem.findMany({
        take: 12,
        orderBy: [{ publishedAt: "desc" }, { discoveredAt: "desc" }],
      }),
    [
      {
        id: "demo-news",
        sourceName: locale === "zh-CN" ? "演示新闻源" : "Demo news feed",
        sourceType: "RSS",
        title: locale === "zh-CN" ? "演示新闻：启动 RSS/外部源后这里会显示实时消息面" : "Demo news: live intel appears here after RSS collectors start",
        summary: locale === "zh-CN" ? "当前是占位内容，用于说明消息面聚合区域。" : "This is placeholder content for the intel feed.",
        url: "https://example.com/demo-news",
        language: locale,
        symbols: ["ETHUSDT"],
        category: "news",
        importanceScore: 0.5,
        discoveredAt: new Date(),
        publishedAt: new Date(),
      },
    ],
  );

  return {
    snapshots,
    rankings: buildRankings(snapshots),
    announcements,
    news,
    intelFeed: buildIntelFeed(announcements, news),
  };
}

export async function getInstrumentPageData(instrument: string, locale: AppLocale = "zh-CN") {
  const canonical = canonicalInstrument(instrument);
  const pageData = await getMarketPageData(locale);
  const snapshots = pageData.snapshots
    .filter((snapshot) => canonicalInstrument(snapshot.instrument) === canonical)
    .sort((left, right) => (right.quoteVolume24h ?? 0) - (left.quoteVolume24h ?? 0));

  const topSnapshot = snapshots[0] ?? sampleSnapshots[0];
  const intelFeed = filterIntelByInstrument(pageData.intelFeed, canonical).slice(0, 12);
  const chartSnapshot =
    snapshots.find((item) => buildTradingViewSymbol({ exchange: item.exchange, instrument: item.instrument, marketType: item.marketType })) ??
    snapshots[0] ??
    topSnapshot;

  return {
    instrument: canonical,
    displayName: topSnapshot.displaySymbol ?? canonical,
    chartSymbol: buildTradingViewSymbol({
      exchange: chartSnapshot.exchange,
      instrument: chartSnapshot.instrument,
      marketType: chartSnapshot.marketType,
    }),
    topSnapshot,
    snapshots,
    intelFeed,
    relatedAnnouncements: intelFeed.filter((item) => item.kind === "announcement"),
    relatedNews: intelFeed.filter((item) => item.kind === "news"),
  };
}

export async function getUserWorkspace(userId?: string | null) {
  if (!userId) {
    return {
      portfolio: null,
      balances: [],
      positions: [],
      orders: [],
      aiConfig: null,
      demoMode: true,
    };
  }

  return withFallback(
    async () => {
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId },
        include: {
          balances: true,
          positions: {
            orderBy: { updatedAt: "desc" },
            take: 12,
          },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 12,
          },
        },
      });

      const aiConfig = await prisma.aiProviderConfig.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      return {
        portfolio,
        balances: portfolio?.balances ?? [],
        positions: portfolio?.positions ?? [],
        orders: portfolio?.orders ?? [],
        aiConfig: aiConfig
          ? {
              ...aiConfig,
              apiKeyEnc: maskSecret(aiConfig.apiKeyEnc),
            }
          : null,
        demoMode: false,
      };
    },
    {
      portfolio: {
        id: "demo-portfolio",
        userId: userId ?? "demo-user",
        name: "Primary Paper Account",
        isPrimary: true,
        totalEquityUsd: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        orders: [],
        balances: [],
        positions: [],
      },
      balances: [
        {
          id: "demo-balance",
          portfolioId: "demo-portfolio",
          asset: "USDT",
          marketType: "SPOT",
          available: 10000,
          locked: 0,
          borrowed: 0,
          updatedAt: new Date(),
        },
      ],
      positions: [],
      orders: [],
      aiConfig: null,
      demoMode: true,
    },
  );
}

export async function getAdminConsoleData(locale: AppLocale = "zh-CN") {
  const [config, sources, users, updates] = await Promise.all([
    withFallback(() => prisma.adminConfig.findUnique({ where: { id: "singleton" } }), null),
    withFallback(
      () =>
        prisma.sourceConfig.findMany({
          orderBy: { updatedAt: "desc" },
        }),
      [],
    ),
    withFallback(() => prisma.user.findMany({ take: 10, orderBy: { createdAt: "desc" } }), []),
    withFallback(
      () =>
        prisma.systemUpdateLog.findMany({
          take: 8,
          orderBy: { startedAt: "desc" },
        }),
      [],
    ),
  ]);

  return {
    config,
    sources,
    users,
    updates: updates.map((item) => ({
      ...item,
      startedLabel: niceDate(item.startedAt, locale),
      finishedLabel: niceDate(item.finishedAt, locale),
    })),
  };
}
