import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title="Admin Sources" subtitle="Visibility into exchange notice collectors, RSS feeds, and future paid intel adapters.">
      <Panel title="Source registry" eyebrow="Ingestion">
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
    </AppShell>
  );
}
