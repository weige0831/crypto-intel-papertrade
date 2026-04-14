import { AppShell, Panel, StatusPill } from "@/components/chrome";
import { AuthForms } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const session = await readSession();

  return (
    <AppShell locale={locale} title={dict.sections.authCenter} subtitle="Email verification registration, password sign-in, and role-aware sessions.">
      <div className="grid gap-6">
        <Panel title="Current session" eyebrow="Access">
          <div className="flex flex-wrap gap-3">
            {session ? (
              <>
                <StatusPill tone="success">{session.email}</StatusPill>
                <StatusPill>{session.role}</StatusPill>
                <StatusPill>{session.locale}</StatusPill>
              </>
            ) : (
              <StatusPill tone="warn">Guest</StatusPill>
            )}
          </div>
        </Panel>
        <Panel title="Register and sign in" eyebrow="Email verification">
          <AuthForms locale={locale} />
        </Panel>
      </div>
    </AppShell>
  );
}
