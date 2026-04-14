import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { ManualOrderForm } from "@/components/interactive";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { requireUserPageSession } from "@/lib/page-auth";
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
  const session = await requireUserPageSession(locale, "/paper-trading");
  const workspace = await getUserWorkspace(session.sub);
  const isZh = locale === "zh-CN";

  const copy = {
    subtitle: isZh ? "支持现货与永续虚拟仓下单、成交、持仓、杠杆和强平跟踪。" : "Spot and perpetual paper execution with fills, positions, leverage, and liquidation tracking.",
    portfolio: isZh ? "账户" : "Portfolio",
    equity: isZh ? "总权益" : "Equity",
    mode: isZh ? "模式" : "Mode",
    demo: isZh ? "演示" : "Demo",
    liveDb: isZh ? "数据库模式" : "Live DB",
    orderPanel: isZh ? "手动虚拟仓下单" : "Manual paper order",
    desk: isZh ? "执行台" : "Execution desk",
    wallet: isZh ? "钱包余额" : "Wallet balances",
    walletEye: isZh ? "资金账户" : "Portfolio",
    noBalances: isZh ? "暂无余额数据。" : "No balances yet.",
    positions: isZh ? "当前持仓" : "Open positions",
    risk: isZh ? "风险" : "Risk",
    noPositions: isZh ? "当前没有持仓。" : "No open positions.",
    recentOrders: isZh ? "最近订单" : "Recent orders",
    audit: isZh ? "审计记录" : "Audit trail",
    noOrders: isZh ? "还没有订单记录。" : "No orders yet.",
    qty: isZh ? "数量" : "Qty",
    entry: isZh ? "开仓价" : "Entry",
    mark: isZh ? "标记价" : "Mark",
    liq: isZh ? "强平价" : "Liq",
  };

  return (
    <AppShell locale={locale} title={dict.sections.paperEngine} subtitle={copy.subtitle}>
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard label={copy.portfolio} value={workspace.portfolio?.name ?? session.email} />
          <StatCard label={copy.equity} value={formatUsd(workspace.portfolio?.totalEquityUsd ?? 10000)} tone="amber" />
          <StatCard label={copy.mode} value={workspace.demoMode ? copy.demo : copy.liveDb} tone="cyan" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title={copy.orderPanel} eyebrow={copy.desk}>
            <ManualOrderForm locale={locale} portfolioId={workspace.portfolio?.id ?? "primary"} />
          </Panel>

          <Panel title={copy.wallet} eyebrow={copy.walletEye}>
            <div className="grid gap-3 md:grid-cols-2">
              {workspace.balances.length === 0 ? (
                <p className="text-sm text-zinc-300">{copy.noBalances}</p>
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
          <Panel title={copy.positions} eyebrow={copy.risk}>
            <div className="space-y-3">
              {workspace.positions.length === 0 ? (
                <p className="text-sm text-zinc-300">{copy.noPositions}</p>
              ) : (
                workspace.positions.map((position) => (
                  <div key={position.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{position.instrument}</p>
                      <StatusPill tone={position.side === "BUY" ? "success" : "warn"}>{position.side}</StatusPill>
                      <StatusPill>{position.marketType}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">
                      {copy.qty} {position.quantity.toFixed(4)} | {copy.entry} {formatUsd(position.entryPrice)} | {copy.mark} {formatUsd(position.markPrice)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {copy.liq} {formatUsd(position.liquidationPrice ?? 0)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title={copy.recentOrders} eyebrow={copy.audit}>
            <div className="space-y-3">
              {workspace.orders.length === 0 ? (
                <p className="text-sm text-zinc-300">{copy.noOrders}</p>
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
