import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  await requireAdminPageSession(locale, "/admin");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: isZh ? "管理员可以在这里查看配置、数据源、用户状态以及部署更新记录。" : "System-level controls for configuration, sources, user oversight, and deployment updates.",
    users: isZh ? "用户数" : "Users",
    sources: isZh ? "数据源" : "Sources",
    updates: isZh ? "更新记录" : "Updates",
    localeLabel: isZh ? "默认语言" : "Locale",
    recentUpdates: isZh ? "最近更新" : "Recent updates",
    deployments: isZh ? "部署记录" : "Deployments",
    noUpdates: isZh ? "还没有更新记录。" : "No update history yet.",
    noMessage: isZh ? "暂无信息" : "No message",
    configuredSources: isZh ? "已配置数据源" : "Configured sources",
    ingestion: isZh ? "采集" : "Ingestion",
    enabled: isZh ? "启用" : "Enabled",
    disabled: isZh ? "停用" : "Disabled",
  };

  return (
    <AppShell locale={locale} title={dict.sections.adminCenter} subtitle={copy.subtitle}>
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard label={copy.users} value={String(admin.users.length)} />
          <StatCard label={copy.sources} value={String(admin.sources.length)} tone="amber" />
          <StatCard label={copy.updates} value={String(admin.updates.length)} tone="cyan" />
          <StatCard label={copy.localeLabel} value={admin.config?.defaultLocale ?? "zh-CN"} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={copy.recentUpdates} eyebrow={copy.deployments}>
            <div className="space-y-3">
              {admin.updates.length === 0 ? (
                <p className="text-sm text-zinc-300">{copy.noUpdates}</p>
              ) : (
                admin.updates.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={item.status === "SUCCEEDED" ? "success" : item.status === "FAILED" ? "warn" : "neutral"}>
                        {item.status}
                      </StatusPill>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.startedLabel}</p>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{item.message ?? copy.noMessage}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title={copy.configuredSources} eyebrow={copy.ingestion}>
            <div className="space-y-3">
              {admin.sources.map((source) => (
                <div key={source.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{source.name}</p>
                    <StatusPill tone={source.enabled ? "success" : "warn"}>{source.enabled ? copy.enabled : copy.disabled}</StatusPill>
                    <StatusPill>{source.kind}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{source.baseUrl}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
