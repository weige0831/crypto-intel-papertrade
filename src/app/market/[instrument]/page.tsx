import Link from "next/link";

import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { LiveEventStream } from "@/components/interactive";
import { TradingViewEmbed } from "@/components/tradingview-embed";
import { resolveLocale } from "@/lib/i18n";
import { getInstrumentPageData } from "@/lib/server/dashboard";
import { formatPercent, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InstrumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ instrument: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { instrument } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const data = await getInstrumentPageData(instrument, locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={`${data.displayName} ${isZh ? "行情详情" : "market detail"}`}
      subtitle={
        isZh
          ? "查看 TradingView K 线、跨交易所价格快照，以及与该币种相关的公告、新闻和实时事件。"
          : "Review the TradingView chart, venue snapshots, and related announcements, news, and runtime events."
      }
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap gap-3">
          <Link href={`/market?lang=${locale}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
            {isZh ? "返回行情广场" : "Back to markets"}
          </Link>
          <StatusPill>{data.instrument}</StatusPill>
          <StatusPill tone={(data.topSnapshot.priceChangePercent24h ?? 0) >= 0 ? "success" : "warn"}>
            {formatPercent(data.topSnapshot.priceChangePercent24h ?? 0)}
          </StatusPill>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Panel title={isZh ? "K 线图表" : "Chart"} eyebrow="TradingView">
            <TradingViewEmbed locale={locale} symbol={data.chartSymbol} />
          </Panel>

          <Panel title={isZh ? "核心行情摘要" : "Core market summary"} eyebrow={isZh ? "最高成交额市场" : "Highest turnover venue"}>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  {data.topSnapshot.exchange} · {data.topSnapshot.marketType}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatUsd(data.topSnapshot.last ?? 0)}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <p>
                    {isZh ? "24h 成交额" : "24h turnover"} {formatUsd(data.topSnapshot.quoteVolume24h ?? 0)}
                  </p>
                  <p>
                    {isZh ? "24h 涨跌幅" : "24h change"} {formatPercent(data.topSnapshot.priceChangePercent24h ?? 0)}
                  </p>
                  <p>
                    {isZh ? "24h 最高" : "24h high"} {formatUsd(data.topSnapshot.high24h ?? 0)}
                  </p>
                  <p>
                    {isZh ? "24h 最低" : "24h low"} {formatUsd(data.topSnapshot.low24h ?? 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {data.snapshots.map((snapshot) => (
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
                    <p className="mt-3 text-sm text-slate-300">
                      {formatUsd(snapshot.last ?? 0)} · {isZh ? "24h 成交额" : "24h turnover"} {formatUsd(snapshot.quoteVolume24h ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title={isZh ? "相关消息面" : "Related intel"} eyebrow={isZh ? "公告 / 新闻" : "Announcements / news"}>
            <div className="space-y-3">
              {data.intelFeed.length === 0 ? (
                <p className="text-sm text-slate-300">{isZh ? "当前暂无该币种相关消息。" : "No related intel yet."}</p>
              ) : (
                data.intelFeed.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-emerald-300/40"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.sourceLabel}</p>
                    <p className="mt-2 font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                  </a>
                ))
              )}
            </div>
          </Panel>

          <Panel title={isZh ? "完整实时事件流" : "Full runtime event stream"} eyebrow="mode=all">
            <LiveEventStream locale={locale} mode="all" instrument={data.instrument} />
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
