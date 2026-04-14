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
  const market = await getMarketPageData(locale);
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: isZh ? "将市场异动、交易所公告和外部新闻统一归集到一个提醒队列。" : "A single queue for market alerts, exchange notices, and external news.",
    realtimeAlerts: isZh ? "实时提醒" : "Realtime alerts",
    exchangeAnnouncements: isZh ? "交易所公告" : "Exchange announcements",
    newsFeed: isZh ? "新闻流" : "News feed",
    intel: isZh ? "情报聚合" : "Intel",
  };

  return (
    <AppShell locale={locale} title={dict.nav.alerts} subtitle={copy.subtitle}>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title={copy.realtimeAlerts} eyebrow="SSE">
          <LiveEventStream locale={locale} />
        </Panel>

        <div className="grid gap-6">
          <Panel title={copy.exchangeAnnouncements} eyebrow={dict.common.latest}>
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

          <Panel title={copy.newsFeed} eyebrow={copy.intel}>
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
