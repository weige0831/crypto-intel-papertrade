import { prisma } from "@/lib/prisma";
import { maskSecret } from "@/lib/crypto";
import { type AppLocale } from "@/lib/constants";
import { niceDate } from "@/lib/utils";

const sampleSnapshots = [
  {
    id: "sample-btc",
    exchange: "BINANCE",
    instrument: "BTCUSDT",
    bid: 67390,
    ask: 67430,
    last: 67420,
    priceChangePercent24h: 2.4,
    volume24h: 329100000,
    metadata: {},
    observedAt: new Date(),
  },
  {
    id: "sample-eth",
    exchange: "OKX",
    instrument: "ETHUSDT",
    bid: 3283,
    ask: 3285,
    last: 3284,
    priceChangePercent24h: -1.1,
    volume24h: 194400000,
    metadata: {},
    observedAt: new Date(),
  },
  {
    id: "sample-sol",
    exchange: "BINANCE",
    instrument: "SOLUSDT",
    bid: 171.2,
    ask: 171.6,
    last: 171.4,
    priceChangePercent24h: 5.8,
    volume24h: 88300000,
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
        take: 12,
        orderBy: [{ observedAt: "desc" }, { volume24h: "desc" }],
      }),
    sampleSnapshots,
  );

  const announcements = await withFallback(
    () =>
      prisma.announcement.findMany({
        take: 6,
        orderBy: { discoveredAt: "desc" },
      }),
    [
      locale === "zh-CN"
        ? {
            id: "demo-1",
            exchange: "BINANCE",
            title: "演示公告：待 Worker 接入后显示实时交易所公告",
            summary: "当前显示的是演示数据，Worker 开始采集后这里会自动切换为真实公告。",
            url: "https://example.com/binance-demo",
            publishedAt: new Date(),
            discoveredAt: new Date(),
            symbols: null,
            category: "listing",
          }
        : {
            id: "demo-1",
            exchange: "BINANCE",
            title: "New listing watch: volatility expected",
            summary: "Demo data shown until the worker stores live exchange notices.",
            url: "https://example.com/binance-demo",
            publishedAt: new Date(),
            discoveredAt: new Date(),
            symbols: null,
            category: "listing",
          },
    ],
  );

  const news = await withFallback(
    () =>
      prisma.newsItem.findMany({
        take: 6,
        orderBy: { discoveredAt: "desc" },
      }),
    [
      locale === "zh-CN"
        ? {
            id: "news-1",
            sourceName: "演示 RSS",
            sourceType: "RSS",
            title: "演示新闻：接入 Worker 后这里会显示聚合消息面",
            summary: "启动 Redis 和 Worker 之后，这里会展示实时抓取并聚合的外部新闻流。",
            url: "https://example.com/news-demo",
            language: "zh-CN",
            symbols: null,
            category: "macro",
            importanceScore: 0.5,
            discoveredAt: new Date(),
            publishedAt: new Date(),
          }
        : {
            id: "news-1",
            sourceName: "Demo RSS",
            sourceType: "RSS",
            title: "Macro risk-on sentiment pushing majors higher",
            summary: "Connect the worker and Redis to see live aggregated feeds here.",
            url: "https://example.com/news-demo",
            language: "en-US",
            symbols: null,
            category: "macro",
            importanceScore: 0.5,
            discoveredAt: new Date(),
            publishedAt: new Date(),
          },
    ],
  );

  return {
    snapshots,
    announcements,
    news,
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
