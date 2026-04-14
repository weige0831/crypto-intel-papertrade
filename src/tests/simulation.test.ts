import { describe, expect, it } from "vitest";

import { applyFunding, estimateLiquidationPrice, simulateOrderFill, validateRisk } from "@/lib/paper-trading/simulation";

describe("paper trading simulation", () => {
  it("calculates perpetual fills", () => {
    const fill = simulateOrderFill({
      side: "BUY",
      quantity: 0.25,
      markPrice: 40000,
      leverage: 5,
      marketType: "PERPETUAL",
    });

    expect(fill.notionalUsd).toBe(10000);
    expect(fill.marginRequiredUsd).toBe(2000);
    expect(fill.liquidationPrice).toBeLessThan(40000);
  });

  it("rejects positions over configured limits", () => {
    const risk = validateRisk({
      quantity: 1,
      leverage: 3,
      markPrice: 50000,
      maxPositionUsd: 10000,
      dailyLossLimitUsd: 200,
    });

    expect(risk.ok).toBe(false);
  });

  it("applies funding charges", () => {
    const funding = applyFunding(250, 0.0001, 10000);
    expect(funding.fundingCost).toBe(1);
    expect(funding.netPnlUsd).toBe(249);
  });

  it("estimates long liquidation price", () => {
    expect(
      estimateLiquidationPrice({
        entryPrice: 3000,
        leverage: 5,
        side: "BUY",
      }),
    ).toBeLessThan(3000);
  });
});
