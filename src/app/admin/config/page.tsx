import { AppShell, Panel } from "@/components/chrome";
import { AdminConfigForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin/config");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "管理员配置" : "Admin Config"}
      subtitle={isZh ? "集中维护 SMTP、GitHub、GHCR 和维护模式等全局参数。" : "SMTP, GitHub, GHCR, and maintenance settings."}
    >
      <Panel title={isZh ? "配置编辑器" : "Configuration editor"} eyebrow={isZh ? "单例管理员配置" : "Singleton admin config"}>
        <AdminConfigForm locale={locale} initial={admin.config} />
      </Panel>
    </AppShell>
  );
}
