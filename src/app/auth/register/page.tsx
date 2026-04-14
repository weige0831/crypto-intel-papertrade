import Link from "next/link";

import { AppShell, Panel } from "@/components/chrome";
import { RegisterForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const isZh = locale === "zh-CN";
  const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : "";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "注册新账号" : "Create your account"}
      subtitle={
        isZh
          ? "在本页直接发送邮箱验证码并完成注册。注册成功后会自动创建默认虚拟仓和个人 AI 配置。"
          : "Request your email code and finish registration here. A default paper portfolio and personal AI config are created automatically."
      }
      showNavigation={false}
      showAuthActions={false}
    >
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel title={isZh ? "注册说明" : "Registration flow"} eyebrow={isZh ? "一步完成" : "Single flow"}>
          <div className="space-y-4 text-sm leading-6 text-slate-300">
            <p>{isZh ? "1. 输入邮箱后点击“发送验证码”。" : "1. Enter your email and request a verification code."}</p>
            <p>{isZh ? "2. 收到验证码后，填写昵称、密码和验证码完成注册。" : "2. Fill in your alias, password, and the verification code to complete registration."}</p>
            <p>{isZh ? "3. 注册成功后会自动进入虚拟仓工作台。" : "3. After success, you are redirected to the paper trading desk."}</p>
            <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/auth/login?lang=${locale}${nextQuery}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
                  {isZh ? "已有账号，去登录" : "Already have an account?"}
                </Link>
                <Link href={`/auth/forgot-password?lang=${locale}${nextQuery}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
                  {isZh ? "忘记密码" : "Forgot password"}
                </Link>
            </div>
          </div>
        </Panel>

        <Panel title={isZh ? "注册表单" : "Registration form"} eyebrow={isZh ? "邮箱验证码 + 密码" : "Email code + password"}>
          <RegisterForm locale={locale} nextPath={params.next} />
        </Panel>
      </div>
    </AppShell>
  );
}
