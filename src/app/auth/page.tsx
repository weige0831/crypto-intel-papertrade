import Link from "next/link";

import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AuthForms } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { buildAuthHref } from "@/lib/page-auth";

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
    subtitle: isZh ? "邮箱验证码注册、密码登录，以及管理员后台的独立登录入口。" : "Email verification onboarding, password sign-in, and a dedicated admin entry.",
    currentSession: isZh ? "当前会话" : "Current session",
    access: isZh ? "访问状态" : "Access",
    guest: isZh ? "访客" : "Guest",
    authTitle: adminMode ? (isZh ? "管理员登录" : "Admin sign in") : isZh ? "注册与登录" : "Register and sign in",
    authEyebrow: adminMode ? (isZh ? "后台入口" : "Admin access") : isZh ? "邮箱验证码" : "Email verification",
    adminHint: isZh ? "管理员后台需要管理员账户登录，普通用户账号无法进入。" : "The admin console requires an admin account.",
    adminDenied: isZh ? "当前账号不是管理员，请改用管理员账户登录。" : "This account is not an administrator account.",
    userHint: isZh ? "注册完成后会自动创建默认虚拟仓和个人 AI 配置。" : "Registration creates a default paper portfolio and personal AI settings.",
    openTarget: isZh ? "继续前往目标页面" : "Continue to target page",
    goPaper: isZh ? "进入虚拟仓" : "Open paper trading",
    goAi: isZh ? "进入 AI 配置" : "Open AI settings",
    goAdmin: isZh ? "进入管理员后台" : "Open admin console",
    adminEntryTitle: isZh ? "管理员后台入口" : "Admin console entry",
    adminEntryDesc: isZh ? "如果你需要进入后台配置 SMTP、数据源和更新脚本，请从这里进入管理员登录。" : "Use this path to sign in as an administrator and manage SMTP, sources, and updates.",
    adminEntryButton: isZh ? "前往管理员登录" : "Go to admin sign in",
  };

  return (
    <AppShell locale={locale} title={dict.sections.authCenter} subtitle={copy.subtitle}>
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

            {adminMode ? (
              <p className="text-sm text-zinc-300">{session && session.role !== "ADMIN" ? copy.adminDenied : copy.adminHint}</p>
            ) : (
              <p className="text-sm text-zinc-300">{copy.userHint}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {nextPath ? (
                <Link href={nextPath} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                  {copy.openTarget}
                </Link>
              ) : null}
              <Link href={`/paper-trading?lang=${locale}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                {copy.goPaper}
              </Link>
              <Link href={`/ai-settings?lang=${locale}`} className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60">
                {copy.goAi}
              </Link>
              {session?.role === "ADMIN" ? (
                <Link href={`/admin?lang=${locale}`} className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 transition hover:border-amber-300/70">
                  {copy.goAdmin}
                </Link>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title={copy.authTitle} eyebrow={copy.authEyebrow}>
          <AuthForms locale={locale} nextPath={nextPath} adminMode={adminMode} />
        </Panel>

        {!adminMode ? (
          <Panel title={copy.adminEntryTitle} eyebrow={dict.nav.admin}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-3xl text-sm text-zinc-300">{copy.adminEntryDesc}</p>
              <Link
                href={buildAuthHref(locale, `/admin?lang=${locale}`, "admin")}
                className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300/70"
              >
                {copy.adminEntryButton}
              </Link>
            </div>
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
