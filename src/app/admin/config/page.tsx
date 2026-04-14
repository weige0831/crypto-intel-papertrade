import { AppShell, Panel } from "@/components/chrome";
import { AdminConfigForm } from "@/components/interactive";
import { getAdminLinks } from "@/lib/admin-nav";
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
      title={isZh ? "管理员配置" : "Admin configuration"}
      subtitle={
        isZh
          ? "集中维护 SMTP、GitHub、GHCR、默认语言和维护模式。其余运行时参数仍然保留在环境变量或后台加密存储中。"
          : "Maintain SMTP, GitHub, GHCR, locale defaults, and maintenance mode from one place."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <Panel title={isZh ? "配置编辑器" : "Configuration editor"} eyebrow={isZh ? "单例系统配置" : "Singleton system config"}>
        <AdminConfigForm locale={locale} initial={admin.config} />
      </Panel>
    </AppShell>
  );
}
