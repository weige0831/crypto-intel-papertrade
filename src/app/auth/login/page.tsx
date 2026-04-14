import Link from "next/link";

import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { LoginForm } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const dict = getDictionary(locale);
  const session = await readSession();
  const adminMode = params.mode === "admin";
  const isZh = locale === "zh-CN";
  const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
  const modeQuery = adminMode ? "&mode=admin" : "";

  const copy = adminMode
    ? {
        title: isZh ? "管理员登录" : "Administrator sign in",
        subtitle: isZh
          ? "管理员入口不会出现在公开导航中。请使用管理员邮箱和密码登录。"
          : "The admin console is intentionally hidden from public navigation. Sign in with an administrator account.",
        eyebrow: isZh ? "隐藏后台入口" : "Hidden admin entry",
        helper: isZh ? "如果当前账号不是管理员，登录后也不会获得后台权限。" : "Non-admin accounts will not gain access even if the login succeeds.",
      }
    : {
        title: isZh ? "登录" : "Sign in",
        subtitle: isZh ? "使用邮箱和密码进入你的虚拟仓、AI 配置和消息面终端。" : "Sign in to your paper trading desk, AI settings, and intel workspace.",
        eyebrow: isZh ? "独立登录页" : "Dedicated sign-in page",
        helper: isZh ? "普通用户从这里登录，管理员请手动访问 /admin 触发管理员登录流程。" : "Regular users sign in here. Administrators should manually visit /admin to enter the admin flow.",
      };

  return (
    <AppShell locale={locale} title={copy.title} subtitle={copy.subtitle} showNavigation={false} showAuthActions={false}>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title={isZh ? "当前会话" : "Current session"} eyebrow={dict.common.signedInAs}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {session ? (
                <>
                  <StatusPill tone="success">{session.email}</StatusPill>
                  <StatusPill>{session.role}</StatusPill>
                  <StatusPill>{session.locale}</StatusPill>
                </>
              ) : (
                <StatusPill tone="warn">{dict.common.guest}</StatusPill>
              )}
            </div>
            <p className="text-sm leading-6 text-slate-300">{copy.helper}</p>
            {!adminMode ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/auth/register?lang=${locale}${nextQuery}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20"
                >
                  {isZh ? "去注册" : "Create account"}
                </Link>
                <Link
                  href={`/auth/forgot-password?lang=${locale}${nextQuery}${modeQuery}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20"
                >
                  {isZh ? "忘记密码" : "Forgot password"}
                </Link>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title={copy.title} eyebrow={copy.eyebrow}>
          <LoginForm locale={locale} nextPath={params.next} adminMode={adminMode} />
        </Panel>
      </div>
    </AppShell>
  );
}
