import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { getAdminLinks } from "@/lib/admin-nav";
import { resolveLocale } from "@/lib/i18n";
import { requireAdminPageSession } from "@/lib/page-auth";
import { getAdminConsoleData } from "@/lib/server/dashboard";
import { niceDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  await requireAdminPageSession(locale, "/admin/users");
  const admin = await getAdminConsoleData(locale);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "用户列表" : "User list"}
      subtitle={
        isZh
          ? "查看最近注册用户、角色和邮箱验证状态。"
          : "Review recently registered users, roles, and email verification status."
      }
      secondaryLinks={getAdminLinks(locale)}
    >
      <Panel title={isZh ? "最近账号" : "Recent accounts"} eyebrow={isZh ? "用户管理" : "User management"}>
        <div className="space-y-3">
          {admin.users.map((user) => (
            <div key={user.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{user.email}</p>
                <StatusPill tone={user.role === "ADMIN" ? "warn" : "success"}>{user.role}</StatusPill>
                <StatusPill>{user.preferredLocale}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isZh ? "创建于" : "Created"} {niceDate(user.createdAt, locale)} | {isZh ? "已验证" : "Verified"}{" "}
                {user.emailVerifiedAt ? (isZh ? "是" : "yes") : isZh ? "否" : "no"}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
