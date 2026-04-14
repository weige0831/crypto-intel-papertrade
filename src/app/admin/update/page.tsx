import { AppShell, Panel } from "@/components/chrome";
import { UpdateTriggerButton } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminUpdatePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin/update");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "管理员更新" : "Admin Update"}
      subtitle={isZh ? "执行固定的 Linux 更新脚本，并查看最近执行日志。" : "Run the fixed Linux update script and inspect recent execution records."}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title={isZh ? "一键更新" : "One-click update"} eyebrow="update.sh">
          <UpdateTriggerButton locale={locale} />
        </Panel>

        <Panel title={isZh ? "最近执行记录" : "Recent executions"} eyebrow={isZh ? "日志" : "Logs"}>
          <div className="space-y-3">
            {admin.updates.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-semibold">{item.status}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.message ?? (isZh ? "暂无信息" : "No message")}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-zinc-400">{item.startedLabel}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
