import Link from "next/link";

import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { LiveEventStream } from "@/components/interactive";
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

  const copy = {
    volume24h: isZh ? "24 小时成交额" : "24h volume",
    eventBus: isZh ? "实时事件总线" : "Live event bus",
    eventBusEye: isZh ? "SSE + Redis" : "SSE + Redis",
    announcements: isZh ? "交易所公告" : "Exchange announcements",
    lanes: isZh ? "平台能力" : "Platform lanes",
    capabilities: isZh ? "能力概览" : "Capabilities",
    marketDesc: isZh ? "跟踪 Binance + OKX 行情、交易所公告和外部新闻。" : "Track Binance + OKX tickers, announcements, and external news.",
    adminDesc: isZh ? "配置 SMTP、AI 默认参数、GitHub 更新目标和系统状态。" : "Configure SMTP, AI defaults, GitHub update targets, and system health.",
  };

  return (
    <AppShell locale={locale} title={dict.home.title} subtitle={dict.home.subtitle}>
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

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel title={dict.sections.liveMarket} eyebrow={dict.common.realtime}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {market.snapshots.slice(0, 6).map((snapshot) => (
                <div key={`${snapshot.exchange}-${snapshot.instrument}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{snapshot.instrument}</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{snapshot.exchange}</p>
                    </div>
                    <StatusPill tone={(snapshot.priceChangePercent24h ?? 0) >= 0 ? "success" : "warn"}>
                      {formatPercent(snapshot.priceChangePercent24h ?? 0)}
                    </StatusPill>
                  </div>
                  <p className="mt-4 text-2xl font-semibold">{formatUsd(snapshot.last ?? 0)}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {copy.volume24h} {formatUsd(snapshot.volume24h ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={copy.eventBus} eyebrow={copy.eventBusEye}>
            <LiveEventStream locale={locale} />
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={copy.announcements} eyebrow={dict.common.latest}>
            <div className="space-y-3">
              {market.announcements.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.exchange}</p>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
                </a>
              ))}
            </div>
          </Panel>

          <Panel title={copy.lanes} eyebrow={copy.capabilities}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {dict.home.highlights.map((item) => (
                  <StatusPill key={item} tone="success">
                    {item}
                  </StatusPill>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/market?lang=${locale}`} className="rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/40">
                  <p className="font-semibold">{dict.home.primaryCta}</p>
                  <p className="mt-2 text-sm text-zinc-300">{copy.marketDesc}</p>
                </Link>
                <Link href={`/admin?lang=${locale}`} className="rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/40">
                  <p className="font-semibold">{dict.home.secondaryCta}</p>
                  <p className="mt-2 text-sm text-zinc-300">{copy.adminDesc}</p>
                </Link>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
