import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { getAdminLinks } from "@/lib/admin-nav";
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
      title={isZh ? "源状态" : "Source registry"}
      subtitle={
        isZh
          ? "查看公告采集器、RSS 源和未来可扩展的付费消息适配器状态。"
          : "Inspect exchange announcement collectors, RSS feeds, and future paid intel adapters."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <Panel title={isZh ? "已配置的数据源" : "Configured sources"} eyebrow={isZh ? "采集链路" : "Ingestion"}>
        <div className="space-y-3">
          {admin.sources.map((source) => (
            <div key={source.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{source.name}</p>
                <StatusPill tone={source.enabled ? "success" : "warn"}>{source.enabled ? (isZh ? "启用" : "Enabled") : isZh ? "停用" : "Disabled"}</StatusPill>
                <StatusPill>{source.kind}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-slate-300">{source.baseUrl}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
