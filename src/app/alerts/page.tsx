import { AppShell, Panel } from "@/components/chrome";
import { LiveEventStream } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { getMarketPageData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AlertsPage({
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
      title={isZh ? "消息中心" : "Intel feed"}
      subtitle={
        isZh
          ? "默认只看公告、新闻、AI 信号和市场预警，不再被海量 market tick 淹没。"
          : "By default this page focuses on announcements, news, AI signals, and market alerts instead of raw market ticks."
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title={isZh ? "实时消息面" : "Realtime intel"} eyebrow="mode=intel">
          <LiveEventStream locale={locale} mode="intel" />
        </Panel>

        <div className="grid gap-6">
          <Panel title={isZh ? "交易所公告" : "Exchange announcements"} eyebrow={isZh ? "官方来源" : "Official sources"}>
            <div className="space-y-3">
              {market.announcements.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-300/40"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.exchange}</p>
                  <p className="mt-2 font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </a>
              ))}
            </div>
          </Panel>

          <Panel title={isZh ? "外部新闻与 RSS" : "External news and RSS"} eyebrow={isZh ? "扩展消息源" : "Extended feeds"}>
            <div className="space-y-3">
              {market.news.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[24px] border border-white/10 bg-slate-950/45 p-4 transition hover:border-amber-300/40"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.sourceName}</p>
                  <p className="mt-2 font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                </a>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
