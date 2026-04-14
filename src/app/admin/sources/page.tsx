import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin/sources");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "管理员数据源" : "Admin Sources"}
      subtitle={isZh ? "查看交易所公告采集器、RSS 新闻源和后续可扩展情报适配器。" : "Visibility into exchange notice collectors, RSS feeds, and future paid intel adapters."}
    >
      <Panel title={isZh ? "数据源注册表" : "Source registry"} eyebrow={isZh ? "采集链路" : "Ingestion"}>
        <div className="space-y-3">
          {admin.sources.map((source) => (
            <div key={source.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{source.name}</p>
                <StatusPill tone={source.enabled ? "success" : "warn"}>{source.enabled ? (isZh ? "启用" : "Enabled") : isZh ? "停用" : "Disabled"}</StatusPill>
                <StatusPill>{source.kind}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{source.baseUrl}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
