import { AppShell, Panel } from "@/components/chrome";
import { AdminConfigForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title="Admin Config" subtitle="SMTP, GitHub, GHCR, and maintenance settings.">
      <Panel title="Configuration editor" eyebrow="Singleton admin config">
        <AdminConfigForm initial={admin.config} />
      </Panel>
    </AppShell>
  );
}
