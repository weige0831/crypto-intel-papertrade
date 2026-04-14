import Link from "next/link";
import { type ReactNode } from "react";

import { readSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ShellLink = {
  href: string;
  label: string;
};

type AppShellProps = {
  locale: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  showAuthActions?: boolean;
  showNavigation?: boolean;
  secondaryLinks?: ShellLink[];
};

export async function AppShell({
  locale,
  title,
  subtitle,
  children,
  showAuthActions = true,
  showNavigation = true,
  secondaryLinks = [],
}: AppShellProps) {
  const dict = getDictionary(locale);
  const session = await readSession();
  const query = `?lang=${locale}`;
  const links = [
    { href: `/${query}`, label: dict.nav.home },
    { href: `/market${query}`, label: dict.nav.market },
    { href: `/paper-trading${query}`, label: dict.nav.paperTrading },
    { href: `/ai-settings${query}`, label: dict.nav.aiSettings },
    { href: `/alerts${query}`, label: dict.nav.alerts },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_26%),linear-gradient(180deg,_#030712,_#08111f_35%,_#0b1324_100%)] text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-5 py-5 lg:px-8">
        <header className="sticky top-4 z-20 mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/75 px-5 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:px-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <Link href={`/${query}`} className="inline-flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
                    CI
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400">{dict.tagline}</p>
                    <p className="mt-1 text-xl font-semibold text-white">{dict.brand}</p>
                  </div>
                </Link>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">{title}</h1>
                  {subtitle ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{subtitle}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                <a
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    locale === "zh-CN"
                      ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20",
                  )}
                  href="?lang=zh-CN"
                >
                  {dict.nav.languageZh}
                </a>
                <a
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition",
                    locale === "en-US"
                      ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20",
                  )}
                  href="?lang=en-US"
                >
                  {dict.nav.languageEn}
                </a>

                {session ? (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <span>{session.email}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs uppercase tracking-[0.24em] text-slate-300">
                      {session.role}
                    </span>
                  </div>
                ) : showAuthActions ? (
                  <>
                    <Link href={`/auth/login${query}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-white/20">
                      {dict.nav.login}
                    </Link>
                    <Link
                      href={`/auth/register${query}`}
                      className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/60"
                    >
                      {dict.nav.register}
                    </Link>
                  </>
                ) : null}
              </div>
            </div>

            {showNavigation ? (
              <nav className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-500/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}

            {secondaryLinks.length > 0 ? (
              <nav className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/40 hover:bg-amber-500/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-white/10 bg-slate-950/65 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:p-6",
        className,
      )}
    >
      {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{eyebrow}</p> : null}
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone = "emerald",
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "cyan";
}) {
  const toneMap = {
    emerald: "from-emerald-500/20 to-transparent",
    amber: "from-amber-500/20 to-transparent",
    cyan: "from-cyan-500/20 to-transparent",
  };

  return (
    <div className={cn("rounded-[26px] border border-white/10 bg-gradient-to-br p-5", toneMap[tone])}>
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warn" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : "border-white/10 bg-white/5 text-slate-200";

  return <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]", toneClass)}>{children}</span>;
}
