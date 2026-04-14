import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title={dict.sections.adminCenter} subtitle="System-level controls for configuration, sources, user oversight, and deployment updates.">
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Users" value={String(admin.users.length)} />
          <StatCard label="Sources" value={String(admin.sources.length)} tone="amber" />
          <StatCard label="Updates" value={String(admin.updates.length)} tone="cyan" />
          <StatCard label="Locale" value={admin.config?.defaultLocale ?? "zh-CN"} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recent updates" eyebrow="Deployments">
            <div className="space-y-3">
              {admin.updates.length === 0 ? (
                <p className="text-sm text-zinc-300">No update history yet.</p>
              ) : (
                admin.updates.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={item.status === "SUCCEEDED" ? "success" : item.status === "FAILED" ? "warn" : "neutral"}>
                        {item.status}
                      </StatusPill>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">{item.startedLabel}</p>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{item.message ?? "No message"}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Configured sources" eyebrow="Ingestion">
            <div className="space-y-3">
              {admin.sources.map((source) => (
                <div key={source.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{source.name}</p>
                    <StatusPill tone={source.enabled ? "success" : "warn"}>{source.enabled ? "Enabled" : "Disabled"}</StatusPill>
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
