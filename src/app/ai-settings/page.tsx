import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AiSettingsForm } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getUserWorkspace } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const session = await readSession();
  const workspace = await getUserWorkspace(session?.sub);

  return (
    <AppShell locale={locale} title={dict.sections.aiControl} subtitle="Configure OpenAI-compatible endpoints, encrypted user keys, and risk-limited auto execution.">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="AI posture" eyebrow="Controls">
          <div className="space-y-3">
            <StatusPill tone={workspace.aiConfig?.isEnabled ? "success" : "warn"}>
              {workspace.aiConfig?.isEnabled ? "Enabled" : "Disabled"}
            </StatusPill>
            <p className="text-sm text-zinc-300">
              Keys are stored encrypted server-side. AI output is validated against a structured trade intent schema before any paper order is created.
            </p>
            <p className="text-sm text-zinc-400">
              If no personal config exists yet, the form below will create one scoped to your account.
            </p>
          </div>
        </Panel>

        <Panel title="Connection and risk settings" eyebrow="OpenAI-compatible">
          {session ? (
            <AiSettingsForm
              initial={
                workspace.aiConfig
                  ? {
                      baseUrl: workspace.aiConfig.baseUrl,
                      model: workspace.aiConfig.model,
                      systemPrompt: workspace.aiConfig.systemPrompt,
                      maxPositionUsd: workspace.aiConfig.maxPositionUsd,
                      riskLimits: workspace.aiConfig.riskLimits as { maxLeverage?: number; dailyLossLimitUsd?: number },
                    }
                  : null
              }
            />
          ) : (
            <p className="text-sm text-zinc-300">Sign in first to save AI settings.</p>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
