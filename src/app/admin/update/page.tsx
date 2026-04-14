import { AppShell, Panel } from "@/components/chrome";
import { UpdateTriggerButton } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminUpdatePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title="Admin Update" subtitle="Run the fixed Linux update script and inspect recent execution records.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="One-click update" eyebrow="update.sh">
          <UpdateTriggerButton />
        </Panel>

        <Panel title="Recent executions" eyebrow="Logs">
          <div className="space-y-3">
            {admin.updates.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-semibold">{item.status}</p>
                <p className="mt-2 text-sm text-zinc-300">{item.message ?? "No message"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-zinc-400">{item.startedLabel}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
