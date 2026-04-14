import { AppShell, Panel } from "@/components/chrome";
import { LiveEventStream } from "@/components/interactive";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getMarketPageData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const market = await getMarketPageData();

  return (
    <AppShell locale={locale} title={dict.nav.alerts} subtitle="A single queue for market alerts, exchange notices, and external news.">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Realtime alerts" eyebrow="SSE">
          <LiveEventStream />
        </Panel>

        <div className="grid gap-6">
          <Panel title="Exchange announcements" eyebrow={dict.common.latest}>
            <div className="space-y-3">
              {market.announcements.map((item) => (
                <div key={item.url} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.exchange}</p>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="News feed" eyebrow="Intel">
            <div className="space-y-3">
              {market.news.map((item) => (
                <div key={item.url} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.sourceName}</p>
                  <p className="mt-2 font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-zinc-300">{item.summary}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
