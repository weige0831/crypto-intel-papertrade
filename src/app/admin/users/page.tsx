import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { resolveLocale } from "@/lib/i18n";
import { getAdminConsoleData } from "@/lib/server/dashboard";
import { niceDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const admin = await getAdminConsoleData();

  return (
    <AppShell locale={locale} title="Admin Users" subtitle="Recent registered users and role visibility.">
      <Panel title="Recent accounts" eyebrow="User management">
        <div className="space-y-3">
          {admin.users.map((user) => (
            <div key={user.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{user.email}</p>
                <StatusPill tone={user.role === "ADMIN" ? "warn" : "success"}>{user.role}</StatusPill>
                <StatusPill>{user.preferredLocale}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-zinc-300">
                Created {niceDate(user.createdAt, locale)} | Verified {user.emailVerifiedAt ? "yes" : "no"}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
