import Link from "next/link";

import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { LiveEventStream, MarketRankingsBoard } from "@/components/interactive";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getHomeMetrics, getMarketPageData } from "@/lib/server/dashboard";
import { formatPercent, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const [metrics, market] = await Promise.all([getHomeMetrics(locale), getMarketPageData(locale)]);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={
        isZh
          ? "先看消息面，再决定怎么开虚拟仓。"
          : "See the news first, then decide how to open a paper trade."
      }
      subtitle={
        isZh
          ? "首页默认展示消息面优先的实时流、成交额榜与 24 小时涨跌榜。点击任一币种可进入详情页查看图表、跨交易所行情和相关新闻。"
          : "The home page prioritizes intel, turnover leaders, and 24-hour movers. Open any instrument for charting, venue snapshots, and related news."
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-4">
          {metrics.map((item, index) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              tone={index === 1 ? "amber" : index === 2 ? "cyan" : "emerald"}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Panel title={isZh ? "主榜单" : "Primary market board"} eyebrow={isZh ? "成交额 / 涨跌切换" : "Turnover / movers toggle"}>
            <MarketRankingsBoard locale={locale} rankings={market.rankings} />
          </Panel>

          <Panel title={isZh ? "消息面优先实时流" : "Intel-first realtime stream"} eyebrow="SSE / Redis">
            <LiveEventStream locale={locale} mode="intel" />
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title={isZh ? "热点市场速览" : "Hot market snapshot"} eyebrow={dict.common.realtime}>
            <div className="grid gap-3 md:grid-cols-2">
              {market.rankings.volume.slice(0, 6).map((snapshot) => (
                <Link
                  key={`${snapshot.exchange}-${snapshot.instrument}`}
                  href={`/market/${snapshot.instrument}?lang=${locale}`}
                  className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-300/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{snapshot.displaySymbol}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                        {snapshot.exchange} · {snapshot.marketType}
                      </p>
                    </div>
                    <StatusPill tone={(snapshot.priceChangePercent24h ?? 0) >= 0 ? "success" : "warn"}>
                      {formatPercent(snapshot.priceChangePercent24h ?? 0)}
                    </StatusPill>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-white">{formatUsd(snapshot.last ?? 0)}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {isZh ? "24h 成交额" : "24h turnover"} {formatUsd(snapshot.quoteVolume24h ?? 0)}
                  </p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title={isZh ? "公告与核心消息" : "Announcements and key intel"} eyebrow={dict.common.latest}>
            <div className="space-y-3">
              {[...market.announcements.slice(0, 3), ...market.news.slice(0, 3)].map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-emerald-300/40"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {"exchange" in item ? item.exchange : item.sourceName}
                  </p>
                  <p className="mt-2 font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </a>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
