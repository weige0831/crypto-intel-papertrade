import type { MarginMode, OrderSide } from "@prisma/client";

import { orderRequestSchema } from "@/lib/domain";
import { toFixedNumber } from "@/lib/utils";

export type SimulatedFill = {
  averageFillPrice: number;
  feeUsd: number;
  notionalUsd: number;
  marginRequiredUsd: number;
  liquidationPrice?: number;
};

export function calculateNotional(quantity: number, price: number) {
  return toFixedNumber(quantity * price, 6);
}

export function estimateFee(notionalUsd: number, feeRate = 0.0004) {
  return toFixedNumber(notionalUsd * feeRate, 6);
}

export function estimateMargin(notionalUsd: number, leverage: number, marketType: "SPOT" | "PERPETUAL") {
  if (marketType === "SPOT") {
    return notionalUsd;
  }

  return toFixedNumber(notionalUsd / leverage, 6);
}

export function estimateLiquidationPrice(params: {
  entryPrice: number;
  leverage: number;
  side: OrderSide;
  maintenanceMarginRatio?: number;
  marginMode?: MarginMode;
}) {
  const mmr = params.maintenanceMarginRatio ?? 0.005;
  const distance = params.entryPrice / params.leverage;

  if (params.side === "BUY") {
    return toFixedNumber(params.entryPrice - distance * (1 - mmr), 6);
  }

  return toFixedNumber(params.entryPrice + distance * (1 - mmr), 6);
}

export function validateRisk(params: {
  quantity: number;
  leverage: number;
  markPrice: number;
  maxPositionUsd: number;
  dailyLossLimitUsd: number;
}) {
  const notionalUsd = calculateNotional(params.quantity, params.markPrice);

  if (notionalUsd > params.maxPositionUsd) {
    return {
      ok: false,
      reason: `Requested notional ${notionalUsd} exceeds limit ${params.maxPositionUsd}`,
    };
  }

  if (params.leverage > 20) {
    return {
      ok: false,
      reason: "Leverage exceeds hard limit 20x",
    };
  }

  if (params.dailyLossLimitUsd <= 0) {
    return {
      ok: false,
      reason: "Daily loss limit exhausted",
    };
  }

  return {
    ok: true,
    reason: null,
  };
}

export function simulateOrderFill(input: {
  side: OrderSide;
  quantity: number;
  markPrice: number;
  leverage: number;
  marketType: "SPOT" | "PERPETUAL";
}) {
  const notionalUsd = calculateNotional(input.quantity, input.markPrice);
  const feeUsd = estimateFee(notionalUsd);
  const marginRequiredUsd = estimateMargin(notionalUsd, input.leverage, input.marketType);

  return {
    averageFillPrice: input.markPrice,
    feeUsd,
    notionalUsd,
    marginRequiredUsd,
    liquidationPrice:
      input.marketType === "PERPETUAL"
        ? estimateLiquidationPrice({
            entryPrice: input.markPrice,
            leverage: input.leverage,
            side: input.side,
          })
        : undefined,
  } satisfies SimulatedFill;
}

export function applyFunding(unrealizedPnlUsd: number, fundingRate: number, notionalUsd: number) {
  const fundingCost = toFixedNumber(notionalUsd * fundingRate, 6);
  return {
    fundingCost,
    netPnlUsd: toFixedNumber(unrealizedPnlUsd - fundingCost, 6),
  };
}

export function evaluateStopTargets(params: {
  side: OrderSide;
  currentPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
}) {
  if (params.side === "BUY") {
    return {
      hitStopLoss: params.stopLoss ? params.currentPrice <= params.stopLoss : false,
      hitTakeProfit: params.takeProfit ? params.currentPrice >= params.takeProfit : false,
    };
  }

  return {
    hitStopLoss: params.stopLoss ? params.currentPrice >= params.stopLoss : false,
    hitTakeProfit: params.takeProfit ? params.currentPrice <= params.takeProfit : false,
  };
}

export function normalizeOrderPayload(input: unknown) {
  return orderRequestSchema.parse(input);
}
