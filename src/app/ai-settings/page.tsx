import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AiSettingsForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
import { requireUserPageSession } from "@/lib/page-auth";
import { getUserWorkspace } from "@/lib/server/dashboard";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const session = await requireUserPageSession(locale, "/ai-settings");
  const workspace = await getUserWorkspace(session.sub);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "AI 配置" : "AI settings"}
      subtitle={
        isZh
          ? "每个用户都可以配置自己的 baseUrl、apiKey、模型和风控边界。AI 只能操作虚拟仓，不能操作真实交易账户。"
          : "Each user can set their own base URL, API key, model, and risk limits. AI is restricted to the paper trading account only."
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <Panel title={isZh ? "当前状态" : "Current posture"} eyebrow={isZh ? "风控说明" : "Risk posture"}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={workspace.aiConfig?.isEnabled ? "success" : "warn"}>
                {workspace.aiConfig?.isEnabled ? (isZh ? "AI 已启用" : "AI enabled") : isZh ? "AI 未启用" : "AI disabled"}
              </StatusPill>
              <StatusPill>{isZh ? "仅限虚拟仓" : "Paper trading only"}</StatusPill>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              {isZh
                ? "你的私有 API Key 会在服务端加密保存。AI 输出必须先通过结构化交易意图校验，再经过风险限制，最后才会创建虚拟仓订单。"
                : "Your private API key is stored encrypted server-side. AI output must pass structured intent validation and risk checks before it can create a paper order."}
            </p>
            <p className="text-sm leading-6 text-slate-400">
              {isZh
                ? "如果你还没有个人配置，下面的表单会为当前账号创建一份专属配置。"
                : "If you do not have a personal config yet, the form below creates one for the current account."}
            </p>
          </div>
        </Panel>

        <Panel title={isZh ? "连接与风险参数" : "Connection and risk controls"} eyebrow={isZh ? "OpenAI 兼容接口" : "OpenAI-compatible gateway"}>
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
