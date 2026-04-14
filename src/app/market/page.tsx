import { AppShell, Panel } from "@/components/chrome";
import { LiveEventStream, MarketRankingsBoard } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { getMarketPageData } from "@/lib/server/dashboard";
import { formatPercent, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const market = await getMarketPageData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "行情广场" : "Market board"}
      subtitle={
        isZh
          ? "按成交额和 24 小时涨跌幅查看全市场热点，并结合公告与新闻流判断消息面方向。"
          : "View turnover leaders and 24-hour movers, then combine them with announcement and news flow."
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={isZh ? "榜单切换" : "Ranking board"} eyebrow={isZh ? "成交额 / 24h 涨跌" : "Turnover / 24h move"}>
          <MarketRankingsBoard locale={locale} rankings={market.rankings} />
        </Panel>

        <Panel title={isZh ? "消息面实时流" : "Realtime intel stream"} eyebrow="SSE / Redis">
          <LiveEventStream locale={locale} mode="intel" />
        </Panel>

        <Panel title={isZh ? "跨交易所快照" : "Cross-exchange snapshots"} eyebrow={isZh ? "最新市场状态" : "Latest venues"}>
          <div className="grid gap-3 md:grid-cols-2">
            {market.snapshots.slice(0, 12).map((snapshot) => (
              <div key={`${snapshot.exchange}-${snapshot.marketType}-${snapshot.instrument}`} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{snapshot.displaySymbol ?? snapshot.instrument}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                      {snapshot.exchange} · {snapshot.marketType}
                    </p>
                  </div>
                  <p className={(snapshot.priceChangePercent24h ?? 0) >= 0 ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>
                    {formatPercent(snapshot.priceChangePercent24h ?? 0)}
                  </p>
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">{formatUsd(snapshot.last ?? 0)}</p>
                <div className="mt-3 grid gap-1 text-sm text-slate-300">
                  <p>
                    {isZh ? "24h 成交额" : "24h turnover"} {formatUsd(snapshot.quoteVolume24h ?? 0)}
                  </p>
                  <p>
                    {isZh ? "24h 最高 / 最低" : "24h high / low"} {formatUsd(snapshot.high24h ?? 0)} / {formatUsd(snapshot.low24h ?? 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={isZh ? "公告与新闻" : "Announcements and news"} eyebrow={isZh ? "消息面" : "Intel"}>
          <div className="space-y-3">
            {market.intelFeed.slice(0, 12).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-amber-300/40"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.sourceLabel}</p>
                <p className="mt-2 font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
