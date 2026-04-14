import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { ManualOrderForm } from "@/components/interactive";
import { readSession } from "@/lib/auth";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getUserWorkspace } from "@/lib/server/dashboard";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaperTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = resolveLocale((await searchParams).lang);
  const dict = getDictionary(locale);
  const session = await readSession();
  const workspace = await getUserWorkspace(session?.sub);

  return (
    <AppShell locale={locale} title={dict.sections.paperEngine} subtitle="Spot and perpetual paper execution with fills, positions, leverage, and liquidation tracking.">
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard label="Portfolio" value={workspace.portfolio?.name ?? "Guest"} />
          <StatCard label="Equity" value={formatUsd(workspace.portfolio?.totalEquityUsd ?? 10000)} tone="amber" />
          <StatCard label="Mode" value={workspace.demoMode ? "Demo" : "Live DB"} tone="cyan" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Manual paper order" eyebrow="Execution desk">
            {session ? (
              <ManualOrderForm portfolioId={workspace.portfolio?.id ?? "primary"} />
            ) : (
              <p className="text-sm text-zinc-300">Sign in first to place paper orders.</p>
            )}
          </Panel>

          <Panel title="Wallet balances" eyebrow="Portfolio">
            <div className="grid gap-3 md:grid-cols-2">
              {workspace.balances.length === 0 ? (
                <p className="text-sm text-zinc-300">No balances yet.</p>
              ) : (
                workspace.balances.map((balance) => (
                  <div key={`${balance.asset}-${balance.marketType}`} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold">{balance.asset}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-400">{balance.marketType}</p>
                    <p className="mt-3 text-2xl font-semibold">{balance.available.toFixed(4)}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Open positions" eyebrow="Risk">
            <div className="space-y-3">
              {workspace.positions.length === 0 ? (
                <p className="text-sm text-zinc-300">No open positions.</p>
              ) : (
                workspace.positions.map((position) => (
                  <div key={position.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{position.instrument}</p>
                      <StatusPill tone={position.side === "BUY" ? "success" : "warn"}>{position.side}</StatusPill>
                      <StatusPill>{position.marketType}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">
                      Qty {position.quantity.toFixed(4)} | Entry {formatUsd(position.entryPrice)} | Mark {formatUsd(position.markPrice)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">Liq {formatUsd(position.liquidationPrice ?? 0)}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Recent orders" eyebrow="Audit trail">
            <div className="space-y-3">
              {workspace.orders.length === 0 ? (
                <p className="text-sm text-zinc-300">No orders yet.</p>
              ) : (
                workspace.orders.map((order) => (
                  <div key={order.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{order.instrument}</p>
                      <StatusPill>{order.orderType}</StatusPill>
                      <StatusPill tone={order.status === "FILLED" ? "success" : "warn"}>{order.status}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">
                      {order.side} {order.quantity} @ {formatUsd(order.averageFillPrice ?? order.limitPrice ?? 0)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}
