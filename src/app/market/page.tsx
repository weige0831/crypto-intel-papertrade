import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { LiveEventStream } from "@/components/interactive";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getMarketPageData } from "@/lib/server/dashboard";
import { formatPercent, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const market = await getMarketPageData(locale);
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: isZh ? "统一展示 Binance + OKX 行情快照，并叠加公告和 RSS 消息面。" : "Unified Binance + OKX market snapshots with announcement and RSS overlays.",
    tracked: isZh ? "跟踪行情快照" : "Tracked snapshots",
    volume24h: isZh ? "24 小时成交额" : "Volume 24h",
    sse: isZh ? "SSE 监控" : "SSE monitor",
    runtime: isZh ? "运行时事件流" : "Runtime feed",
    notices: isZh ? "交易所公告" : "Exchange notices",
    news: isZh ? "外部新闻" : "External news",
    newsEye: isZh ? "RSS / API" : "RSS / API",
  };

  return (
    <AppShell locale={locale} title={dict.sections.liveMarket} subtitle={copy.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={copy.tracked} eyebrow={dict.common.realtime}>
          <div className="grid gap-3 md:grid-cols-2">
            {market.snapshots.map((snapshot) => (
              <div key={`${snapshot.exchange}-${snapshot.instrument}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{snapshot.instrument}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{snapshot.exchange}</p>
                  </div>
                  <StatusPill tone={(snapshot.priceChangePercent24h ?? 0) >= 0 ? "success" : "warn"}>
                    {formatPercent(snapshot.priceChangePercent24h)}
                  </StatusPill>
                </div>
                <p className="mt-3 text-2xl font-semibold">{formatUsd(snapshot.last ?? 0)}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {copy.volume24h}: {formatUsd(snapshot.volume24h ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={copy.sse} eyebrow={copy.runtime}>
          <LiveEventStream locale={locale} />
        </Panel>

        <Panel title={copy.notices} eyebrow={dict.common.latest}>
          <div className="space-y-3">
            {market.announcements.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.exchange}</p>
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
              </a>
            ))}
          </div>
        </Panel>

        <Panel title={copy.news} eyebrow={copy.newsEye}>
          <div className="space-y-3">
            {market.news.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[24px] border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.sourceName}</p>
                <p className="mt-2 font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
