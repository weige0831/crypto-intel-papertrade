import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AiSettingsForm } from "@/components/interactive";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { requireUserPageSession } from "@/lib/page-auth";
import { getUserWorkspace } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const session = await requireUserPageSession(locale, "/ai-settings");
  const workspace = await getUserWorkspace(session.sub);
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: isZh ? "配置兼容 OpenAI 风格接口的地址、用户私有密钥，以及 AI 自动开仓风控参数。" : "Configure OpenAI-compatible endpoints, encrypted user keys, and risk-limited auto execution.",
    posture: isZh ? "AI 状态" : "AI posture",
    controls: isZh ? "控制项" : "Controls",
    enabled: isZh ? "已启用" : "Enabled",
    disabled: isZh ? "未启用" : "Disabled",
    encrypted: isZh ? "API Key 会在服务端加密保存。AI 输出必须先通过结构化交易意图校验，随后才能创建虚拟仓订单。" : "Keys are stored encrypted server-side. AI output is validated against a structured trade intent schema before any paper order is created.",
    createHint: isZh ? "如果当前还没有个人 AI 配置，下面的表单会为你的账户创建一份专属配置。" : "If no personal config exists yet, the form below will create one scoped to your account.",
    connection: isZh ? "连接与风险设置" : "Connection and risk settings",
    compatible: isZh ? "兼容 OpenAI 风格接口" : "OpenAI-compatible",
  };

  return (
    <AppShell locale={locale} title={dict.sections.aiControl} subtitle={copy.subtitle}>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title={copy.posture} eyebrow={copy.controls}>
          <div className="space-y-3">
            <StatusPill tone={workspace.aiConfig?.isEnabled ? "success" : "warn"}>
              {workspace.aiConfig?.isEnabled ? copy.enabled : copy.disabled}
            </StatusPill>
            <p className="text-sm text-zinc-300">{copy.encrypted}</p>
            <p className="text-sm text-zinc-400">{copy.createHint}</p>
          </div>
        </Panel>

        <Panel title={copy.connection} eyebrow={copy.compatible}>
          <AiSettingsForm
            locale={locale}
            initial={
              workspace.aiConfig
                ? {
                    baseUrl: workspace.aiConfig.baseUrl,
                    model: workspace.aiConfig.model,
                    systemPrompt: workspace.aiConfig.systemPrompt,
                    maxPositionUsd: workspace.aiConfig.maxPositionUsd,
                    riskLimits: workspace.aiConfig.riskLimits as { maxLeverage?: number; dailyLossLimitUsd?: number },
                    enabled: workspace.aiConfig.isEnabled,
                  }
                : null
            }
          />
        </Panel>
      </div>
    </AppShell>
  );
}
