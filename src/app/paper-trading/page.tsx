import { AppShell, Panel, StatCard, StatusPill } from "@/components/chrome";
import { ManualOrderForm } from "@/components/interactive";
import { resolveLocale } from "@/lib/i18n";
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
  const session = await requireUserPageSession(locale, "/paper-trading");
  const workspace = await getUserWorkspace(session.sub);
  const isZh = locale === "zh-CN";

  return (
    <AppShell
      locale={locale}
      title={isZh ? "虚拟仓执行台" : "Paper trading desk"}
      subtitle={
        isZh
          ? "这里的下单、持仓、止盈止损和杠杆都只作用于虚拟仓。AI 自动开仓也只会写入这一套模拟账户。"
          : "Orders, positions, stops, and leverage here affect only the paper account. AI execution is restricted to this simulated portfolio."
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard label={isZh ? "账户" : "Portfolio"} value={workspace.portfolio?.name ?? session.email} />
          <StatCard label={isZh ? "总权益" : "Equity"} value={formatUsd(workspace.portfolio?.totalEquityUsd ?? 10000)} tone="amber" />
          <StatCard label={isZh ? "数据模式" : "Data mode"} value={workspace.demoMode ? (isZh ? "演示数据" : "Demo data") : (isZh ? "数据库实时" : "Live database")} tone="cyan" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Panel title={isZh ? "手动下单" : "Manual order"} eyebrow={isZh ? "执行表单" : "Execution form"}>
            <ManualOrderForm locale={locale} portfolioId={workspace.portfolio?.id ?? "primary"} />
          </Panel>

          <Panel title={isZh ? "钱包余额" : "Wallet balances"} eyebrow={isZh ? "资产视图" : "Portfolio assets"}>
            <div className="grid gap-3 md:grid-cols-2">
              {workspace.balances.length === 0 ? (
                <p className="text-sm text-slate-300">{isZh ? "当前还没有余额数据。" : "No balances yet."}</p>
              ) : (
                workspace.balances.map((balance) => (
                  <div key={`${balance.asset}-${balance.marketType}`} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <p className="font-semibold text-white">{balance.asset}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{balance.marketType}</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{balance.available.toFixed(4)}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title={isZh ? "当前持仓" : "Open positions"} eyebrow={isZh ? "风险暴露" : "Risk exposure"}>
            <div className="space-y-3">
              {workspace.positions.length === 0 ? (
                <p className="text-sm text-slate-300">{isZh ? "当前没有持仓。" : "No open positions."}</p>
              ) : (
                workspace.positions.map((position) => (
                  <div key={position.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{position.instrument}</p>
                      <StatusPill tone={position.side === "BUY" ? "success" : "warn"}>{position.side}</StatusPill>
                      <StatusPill>{position.marketType}</StatusPill>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300">
                      <p>
                        {isZh ? "数量" : "Quantity"} {position.quantity.toFixed(4)}
                      </p>
                      <p>
                        {isZh ? "开仓价 / 标记价" : "Entry / mark"} {formatUsd(position.entryPrice)} / {formatUsd(position.markPrice)}
                      </p>
                      <p>
                        {isZh ? "强平价" : "Liquidation"} {formatUsd(position.liquidationPrice ?? 0)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title={isZh ? "最近订单" : "Recent orders"} eyebrow={isZh ? "执行记录" : "Execution log"}>
            <div className="space-y-3">
              {workspace.orders.length === 0 ? (
                <p className="text-sm text-slate-300">{isZh ? "还没有订单记录。" : "No orders yet."}</p>
              ) : (
                workspace.orders.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{order.instrument}</p>
                      <StatusPill>{order.orderType}</StatusPill>
                      <StatusPill tone={order.status === "FILLED" ? "success" : "warn"}>{order.status}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
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
