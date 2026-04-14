import Link from "next/link";

import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AuthForms } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const dict = getDictionary(locale);
  const session = await readSession();
  const adminMode = params.mode === "admin";
  const nextPath = params.next;
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: adminMode
      ? isZh
        ? "管理员登录页。普通用户账号不会显示后台入口。"
        : "Administrator sign-in page. The admin console is intentionally hidden from normal navigation."
      : isZh
        ? "邮箱验证码注册与密码登录入口。"
        : "Dedicated email verification registration and password sign-in page.",
    currentSession: isZh ? "当前会话" : "Current session",
    access: isZh ? "访问状态" : "Access",
    guest: isZh ? "访客" : "Guest",
    authTitle: adminMode ? (isZh ? "管理员登录" : "Admin sign in") : isZh ? "注册与登录" : "Register and sign in",
    authEyebrow: adminMode ? (isZh ? "隐藏后台入口" : "Hidden admin entry") : isZh ? "独立认证页" : "Dedicated auth page",
    adminHint: isZh ? "如果你是管理员，请直接在这里登录，成功后会自动跳转到后台。" : "If you are an administrator, sign in here and you will be redirected to the admin console.",
    adminDenied: isZh ? "当前账号不是管理员，请改用管理员账户登录。" : "This account is not an administrator account.",
    userHint: isZh ? "注册完成后会自动创建默认虚拟仓和个人 AI 配置。" : "Registration creates a default paper portfolio and personal AI settings.",
    openTarget: isZh ? "继续前往目标页面" : "Continue to target page",
    goPaper: isZh ? "进入虚拟仓" : "Open paper trading",
    goAi: isZh ? "进入 AI 配置" : "Open AI settings",
  };

  return (
    <AppShell locale={locale} title={dict.sections.authCenter} subtitle={copy.subtitle} showAuthShortcut={false}>
      <div className="grid gap-6">
        <Panel title={copy.currentSession} eyebrow={copy.access}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {session ? (
                <>
                  <StatusPill tone="success">{session.email}</StatusPill>
                  <StatusPill>{session.role}</StatusPill>
                  <StatusPill>{session.locale}</StatusPill>
                </>
              ) : (
                <StatusPill tone="warn">{copy.guest}</StatusPill>
              )}
            </div>

            <p className="text-sm text-zinc-300">{adminMode ? (session && session.role !== "ADMIN" ? copy.adminDenied : copy.adminHint) : copy.userHint}</p>

            <div className="flex flex-wrap gap-3">
              {nextPath ? (
                <Link href={nextPath} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                  {copy.openTarget}
                </Link>
              ) : null}
              {!adminMode ? (
                <>
                  <Link href={`/paper-trading?lang=${locale}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                    {copy.goPaper}
                  </Link>
                  <Link href={`/ai-settings?lang=${locale}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                    {copy.goAi}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title={copy.authTitle} eyebrow={copy.authEyebrow}>
          <AuthForms locale={locale} nextPath={nextPath} adminMode={adminMode} />
        </Panel>
      </div>
    </AppShell>
  );
}
