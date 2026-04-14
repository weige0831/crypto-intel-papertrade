import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";
import { env } from "@/lib/env";

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
      title={isZh ? "管理员系统状态" : "Admin System"}
      subtitle={isZh ? "查看 Linux 目标机的运行环境、更新权限和最近任务记录。" : "Deployment and runtime health surface for the Linux server target."}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={isZh ? "运行环境" : "Runtime"} eyebrow={isZh ? "环境变量" : "Environment"}>
          <div className="flex flex-wrap gap-2">
            <StatusPill>{env.NODE_ENV}</StatusPill>
            <StatusPill tone={env.ALLOW_SYSTEM_UPDATE ? "success" : "warn"}>
              {env.ALLOW_SYSTEM_UPDATE ? (isZh ? "允许更新" : "Updates enabled") : isZh ? "禁止更新" : "Updates blocked"}
            </StatusPill>
            <StatusPill>{env.GHCR_IMAGE}</StatusPill>
          </div>
        </Panel>

        <Panel title={isZh ? "更新历史" : "Update history"} eyebrow={isZh ? "最近任务" : "Recent jobs"}>
          <div className="space-y-3">
            {admin.updates.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={item.status === "SUCCEEDED" ? "success" : item.status === "FAILED" ? "warn" : "neutral"}>
                    {item.status}
                  </StatusPill>
                  <StatusPill>{item.startedLabel}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{item.message ?? (isZh ? "暂无详细记录。" : "No details recorded.")}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
