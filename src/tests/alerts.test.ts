import { describe, expect, it } from "vitest";

import { buildMarketAlert } from "@/lib/market/alerts";

describe("market alerts", () => {
  it("flags high severity on large dislocations", () => {
    const alert = buildMarketAlert({
      instrument: "BTCUSDT",
      previousPrice: 60000,
      lastPrice: 64000,
      spreadPercent: 1.1,
    });

    expect(alert.severity).toBe("high");
    expect(alert.instrument).toBe("BTCUSDT");
  });
});
