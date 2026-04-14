import Link from "next/link";

import { AppShell, Panel } from "@/components/chrome";
import { ForgotPasswordForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const isZh = locale === "zh-CN";
  const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
  const modeQuery = params.mode === "admin" ? "&mode=admin" : "";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "忘记密码" : "Reset password"}
      subtitle={
        isZh
          ? "输入邮箱并发送重置验证码，然后在同一页面完成密码重置。"
          : "Request a reset code for your email and complete the password reset in the same page."
      }
      showNavigation={false}
      showAuthActions={false}
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel title={isZh ? "找回说明" : "Recovery flow"} eyebrow={isZh ? "重置密码" : "Password recovery"}>
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>{isZh ? "1. 输入你的注册邮箱并点击“发送验证码”。" : "1. Enter your registered email and request a reset code."}</p>
            <p>{isZh ? "2. 收到验证码后，填写新密码并确认。" : "2. After receiving the code, enter your new password twice."}</p>
            <p>{isZh ? "3. 重置成功后返回登录页重新登录。" : "3. After success, go back to the sign-in page and log in with the new password."}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/auth/login?lang=${locale}${nextQuery}${modeQuery}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
                {isZh ? "返回登录" : "Back to login"}
              </Link>
              <Link href={`/auth/register?lang=${locale}${nextQuery}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
                {isZh ? "没有账号，去注册" : "Need an account?"}
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title={isZh ? "重置表单" : "Reset form"} eyebrow={isZh ? "邮箱验证码" : "Email verification"}>
          <ForgotPasswordForm locale={locale} />
        </Panel>
      </div>
    </AppShell>
  );
}
