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
  const market = await getMarketPageData();

  return (
    <AppShell locale={locale} title={dict.sections.liveMarket} subtitle="Unified Binance + OKX market snapshots with announcement and RSS overlays.">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Tracked snapshots" eyebrow={dict.common.realtime}>
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
                <p className="mt-1 text-sm text-zinc-400">Volume 24h: {formatUsd(snapshot.volume24h ?? 0)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="SSE monitor" eyebrow="Runtime feed">
          <LiveEventStream />
        </Panel>

        <Panel title="Exchange notices" eyebrow={dict.common.latest}>
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

        <Panel title="External news" eyebrow="RSS / API">
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
