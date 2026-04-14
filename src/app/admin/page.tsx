import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { getAdminLinks } from "@/lib/admin-nav";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "管理员后台" : "Admin console"}
      subtitle={
        isZh
          ? "集中查看系统配置、消息源状态、近期更新和最近注册用户。管理员入口只保留手动访问 /admin。"
          : "Review configuration, source status, recent updates, and newly registered users. The admin console stays hidden from public navigation."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard label={isZh ? "最近用户" : "Recent users"} value={String(admin.users.length)} />
          <StatCard label={isZh ? "启用源" : "Sources"} value={String(admin.sources.length)} tone="amber" />
          <StatCard label={isZh ? "更新记录" : "Updates"} value={String(admin.updates.length)} tone="cyan" />
          <StatCard label={isZh ? "默认语言" : "Default locale"} value={admin.config?.defaultLocale ?? "zh-CN"} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={isZh ? "最近更新" : "Recent updates"} eyebrow={isZh ? "部署记录" : "Deployments"}>
            <div className="space-y-3">
              {admin.updates.length === 0 ? (
                <p className="text-sm text-slate-300">{isZh ? "当前还没有更新记录。" : "No update history yet."}</p>
              ) : (
                admin.updates.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={item.status === "SUCCEEDED" ? "success" : item.status === "FAILED" ? "warn" : "neutral"}>
                        {item.status}
                      </StatusPill>
                      <StatusPill>{item.startedLabel}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.message ?? (isZh ? "暂无附加信息。" : "No message recorded.")}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title={isZh ? "消息源状态" : "Source status"} eyebrow={isZh ? "公告 / RSS / 适配器" : "Announcements / RSS / adapters"}>
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
        </section>
      </div>
    </AppShell>
  );
}
