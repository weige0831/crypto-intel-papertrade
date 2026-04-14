import Link from "next/link";
import { type ReactNode } from "react";

import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AppShellProps = {
  locale: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  showAuthShortcut?: boolean;
};

export function AppShell({ locale, title, subtitle, children, showAuthShortcut = true }: AppShellProps) {
  const dict = getDictionary(locale);
  const query = `?lang=${locale}`;

  const links = [
    { href: `/${query}`, label: dict.nav.home },
    { href: `/market${query}`, label: dict.nav.market },
    { href: `/paper-trading${query}`, label: dict.nav.paperTrading },
    { href: `/ai-settings${query}`, label: dict.nav.aiSettings },
    { href: `/alerts${query}`, label: dict.nav.alerts },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_28%),linear-gradient(180deg,_#03130f,_#071b17_42%,_#0c1f21)] text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/70">{dict.tagline}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-3xl text-sm text-zinc-300">{subtitle}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {showAuthShortcut ? (
                <Link
                  href={`/auth${query}`}
                  className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 font-medium text-emerald-100 transition hover:border-emerald-300/70"
                >
                  {dict.nav.auth}
                </Link>
              ) : null}
              <a
                className={cn(
                  "rounded-full border px-3 py-1.5 transition hover:border-emerald-300 hover:text-emerald-200",
                  locale === "zh-CN" ? "border-emerald-300 bg-emerald-300/10 text-emerald-200" : "border-white/15 text-zinc-300",
                )}
                href="?lang=zh-CN"
              >
                中文
              </a>
              <a
                className={cn(
                  "rounded-full border px-3 py-1.5 transition hover:border-amber-300 hover:text-amber-200",
                  locale === "en-US" ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/15 text-zinc-300",
                )}
                href="?lang=en-US"
              >
                English
              </a>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-300/60 hover:bg-emerald-300/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
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
    <section className={cn("rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl", className)}>
      {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">{eyebrow}</p> : null}
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-4">{children}</div>
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
    emerald: "from-emerald-400/25 to-emerald-400/5 text-emerald-200",
    amber: "from-amber-400/25 to-amber-400/5 text-amber-200",
    cyan: "from-cyan-400/25 to-cyan-400/5 text-cyan-200",
  };

  return (
    <div className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${toneMap[tone]} p-4`}>
      <p className="text-xs uppercase tracking-[0.25em] text-white/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warn" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
      : tone === "warn"
        ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
        : "border-white/15 bg-white/5 text-zinc-200";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${toneClass}`}>{children}</span>;
}
