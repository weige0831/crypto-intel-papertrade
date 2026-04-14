import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title="Admin System" subtitle="Deployment and runtime health surface for the Linux server target.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Runtime" eyebrow="Environment">
          <div className="flex flex-wrap gap-2">
            <StatusPill>{env.NODE_ENV}</StatusPill>
            <StatusPill tone={env.ALLOW_SYSTEM_UPDATE ? "success" : "warn"}>
              {env.ALLOW_SYSTEM_UPDATE ? "Updates enabled" : "Updates blocked"}
            </StatusPill>
            <StatusPill>{env.GHCR_IMAGE}</StatusPill>
          </div>
        </Panel>

        <Panel title="Update history" eyebrow="Recent jobs">
          <div className="space-y-3">
            {admin.updates.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={item.status === "SUCCEEDED" ? "success" : item.status === "FAILED" ? "warn" : "neutral"}>
                    {item.status}
                  </StatusPill>
                  <StatusPill>{item.startedLabel}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{item.message ?? "No details recorded."}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
