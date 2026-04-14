import { AppShell, Panel } from "@/components/chrome";
import { UpdateTriggerButton } from "@/components/interactive";
import { getAdminLinks } from "@/lib/admin-nav";
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
      title={isZh ? "系统更新" : "System updates"}
      subtitle={
        isZh
          ? "后台按钮只会触发固定的 update.sh，不允许执行任意命令。"
          : "The admin button triggers the fixed update.sh flow only; it does not allow arbitrary commands."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title={isZh ? "一键更新" : "One-click update"} eyebrow="update.sh">
          <UpdateTriggerButton locale={locale} />
        </Panel>

        <Panel title={isZh ? "最近执行记录" : "Recent executions"} eyebrow={isZh ? "更新日志" : "Update log"}>
          <div className="space-y-3">
            {admin.updates.length === 0 ? (
              <p className="text-sm text-slate-300">{isZh ? "当前还没有更新执行记录。" : "No update executions recorded yet."}</p>
            ) : (
              admin.updates.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                  <p className="font-semibold text-white">{item.status}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.message ?? (isZh ? "暂无附加信息。" : "No message recorded.")}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{item.startedLabel}</p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
