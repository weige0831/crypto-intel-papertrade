import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { getAdminLinks } from "@/lib/admin-nav";
import { env } from "@/lib/env";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin/system");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "系统状态" : "System runtime"}
      subtitle={
        isZh
          ? "查看 Linux 部署环境、更新权限和管理员恢复命令。"
          : "Inspect the Linux deployment environment, update permissions, and the admin recovery command."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={isZh ? "运行环境" : "Runtime"} eyebrow={isZh ? "环境变量摘要" : "Environment summary"}>
          <div className="flex flex-wrap gap-2">
            <StatusPill>{env.NODE_ENV}</StatusPill>
            <StatusPill tone={env.ALLOW_SYSTEM_UPDATE ? "success" : "warn"}>
              {env.ALLOW_SYSTEM_UPDATE ? (isZh ? "允许更新" : "Updates enabled") : isZh ? "禁止更新" : "Updates blocked"}
            </StatusPill>
            <StatusPill>{env.GHCR_IMAGE}</StatusPill>
          </div>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-white">{isZh ? "管理员重置命令" : "Admin reset command"}</p>
            <pre className="mt-3 overflow-x-auto text-xs text-slate-300">
{`ADMIN_EMAIL=admin@example.com \\
ADMIN_PASSWORD='ChangeThisPassword123!' \\
sh scripts/reset-admin.sh`}
            </pre>
          </div>
        </Panel>

        <Panel title={isZh ? "更新历史" : "Update history"} eyebrow={isZh ? "最近任务" : "Recent jobs"}>
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
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.message ?? (isZh ? "暂无附加信息。" : "No details recorded.")}</p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
