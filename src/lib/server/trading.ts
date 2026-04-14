import { Prisma } from "@prisma/client";

import { runtimeEventSchema, type TradeIntent } from "@/lib/domain";
import { canonicalInstrument } from "@/lib/market/normalize";
import {
  applyFunding,
  estimateLiquidationPrice,
  normalizeOrderPayload,
  simulateOrderFill,
  validateRisk,
} from "@/lib/paper-trading/simulation";
import { prisma } from "@/lib/prisma";
import { publishRuntimeEvent } from "@/lib/server/bus";
import { recordAudit } from "@/lib/server/audit";

type SubmitOrderInput = Parameters<typeof normalizeOrderPayload>[0] | TradeIntent;

async function getPrimaryPortfolio(userId: string) {
  const existing = await prisma.portfolio.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.portfolio.create({
    data: {
      userId,
      name: "Primary Paper Account",
      isPrimary: true,
      totalEquityUsd: 10000,
    },
  });
}

async function getMarkPrice(exchange: string, instrument: string) {
  const snapshot = await prisma.marketSnapshot.findUnique({
    where: {
      exchange_instrument: {
        exchange,
        instrument: canonicalInstrument(instrument),
      },
    },
  });

  return snapshot?.last ?? snapshot?.bid ?? snapshot?.ask ?? 1;
}

function weightedAverage(currentQty: number, currentPrice: number, nextQty: number, nextPrice: number) {
  const totalQty = currentQty + nextQty;
  return totalQty === 0 ? 0 : (currentQty * currentPrice + nextQty * nextPrice) / totalQty;
}

export async function submitPaperOrder(userId: string, rawInput: SubmitOrderInput) {
  const input =
    "size" in (rawInput as Record<string, unknown>)
      ? normalizeOrderPayload({
          portfolioId: "",
          exchange: "SIMULATED",
          instrument: (rawInput as TradeIntent).instrument,
          marketType: (rawInput as TradeIntent).marketType,
          side: (rawInput as TradeIntent).side,
          orderType: (rawInput as TradeIntent).orderType,
          quantity: (rawInput as TradeIntent).size,
          leverage: (rawInput as TradeIntent).leverage,
          takeProfit: (rawInput as TradeIntent).tp,
          stopLoss: (rawInput as TradeIntent).sl,
          source: "ai",
          reason: (rawInput as TradeIntent).thesis,
        })
      : normalizeOrderPayload(rawInput);

  const portfolio = await getPrimaryPortfolio(userId);
  const markPrice = await getMarkPrice(input.exchange, input.instrument);
  const risk = validateRisk({
    quantity: input.quantity,
    leverage: input.leverage,
    markPrice,
    maxPositionUsd: 10000,
    dailyLossLimitUsd: 500,
  });

  if (!risk.ok) {
    const rejectedOrder = await prisma.order.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        source: input.source,
        exchange: input.exchange,
        marketType: input.marketType,
        instrument: canonicalInstrument(input.instrument),
        side: input.side,
        orderType: input.orderType,
        status: "REJECTED",
        quantity: input.quantity,
        leverage: input.leverage,
        marginMode: input.marginMode,
        reason: risk.reason ?? input.reason,
      },
    });

    await recordAudit({
      userId,
      action: "order.rejected",
      targetType: "Order",
      targetId: rejectedOrder.id,
      payload: risk,
    });

    return {
      ok: false,
      reason: risk.reason,
      order: rejectedOrder,
    };
  }

  const fill = simulateOrderFill({
    side: input.side,
    quantity: input.quantity,
    markPrice,
    leverage: input.leverage,
    marketType: input.marketType,
  });

  const result = await prisma.$transaction(async (tx) => {
    const existingPosition = await tx.position.findFirst({
      where: {
        portfolioId: portfolio.id,
        instrument: canonicalInstrument(input.instrument),
        marketType: input.marketType,
        side: input.side,
      },
    });

    const position = existingPosition
      ? await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: existingPosition.quantity + input.quantity,
            entryPrice: weightedAverage(
              existingPosition.quantity,
              existingPosition.entryPrice,
              input.quantity,
              markPrice,
            ),
            markPrice,
            unrealizedPnlUsd: 0,
            leverage: input.leverage,
            marginMode: input.marginMode,
            takeProfit: input.takeProfit,
            stopLoss: input.stopLoss,
            liquidationPrice:
              input.marketType === "PERPETUAL"
                ? estimateLiquidationPrice({
                    entryPrice: markPrice,
                    leverage: input.leverage,
                    side: input.side,
                  })
                : null,
          },
        })
      : await tx.position.create({
          data: {
            portfolioId: portfolio.id,
            marketType: input.marketType,
            instrument: canonicalInstrument(input.instrument),
            side: input.side,
            quantity: input.quantity,
            entryPrice: markPrice,
            markPrice,
            leverage: input.leverage,
            marginMode: input.marginMode,
            liquidationPrice:
              input.marketType === "PERPETUAL"
                ? estimateLiquidationPrice({
                    entryPrice: markPrice,
                    leverage: input.leverage,
                    side: input.side,
                  })
                : null,
            takeProfit: input.takeProfit,
            stopLoss: input.stopLoss,
          },
        });

    const order = await tx.order.create({
      data: {
        portfolioId: portfolio.id,
        userId,
        positionId: position.id,
        source: input.source,
        exchange: input.exchange,
        marketType: input.marketType,
        instrument: canonicalInstrument(input.instrument),
        side: input.side,
        orderType: input.orderType,
        status: "FILLED",
        quantity: input.quantity,
        filledQuantity: input.quantity,
        averageFillPrice: fill.averageFillPrice,
        leverage: input.leverage,
        marginMode: input.marginMode,
        takeProfit: input.takeProfit,
        stopLoss: input.stopLoss,
        feesUsd: fill.feeUsd,
        notionalUsd: fill.notionalUsd,
        reason: input.reason,
        fills: {
          create: {
            price: fill.averageFillPrice,
            quantity: input.quantity,
            feeUsd: fill.feeUsd,
            feeAsset: "USD",
          },
        },
      },
      include: { fills: true },
    });

    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        totalEquityUsd: {
          increment: -fill.feeUsd,
        },
      },
    });

    return { order, position };
  });

  const orderEvent = runtimeEventSchema.parse({
    type: "order_fill",
    payload: {
      orderId: result.order.id,
      instrument: result.order.instrument,
      side: result.order.side,
      quantity: result.order.quantity,
      averageFillPrice: result.order.averageFillPrice,
      feesUsd: result.order.feesUsd,
    },
    createdAt: new Date().toISOString(),
  });

  const positionEvent = runtimeEventSchema.parse({
    type: "position_update",
    payload: {
      positionId: result.position.id,
      instrument: result.position.instrument,
      quantity: result.position.quantity,
      entryPrice: result.position.entryPrice,
      markPrice: result.position.markPrice,
      liquidationPrice: result.position.liquidationPrice,
    },
    createdAt: new Date().toISOString(),
  });

  await Promise.all([
    publishRuntimeEvent(orderEvent),
    publishRuntimeEvent(positionEvent),
    recordAudit({
      userId,
      action: "order.filled",
      targetType: "Order",
      targetId: result.order.id,
      payload: {
        instrument: result.order.instrument,
        source: result.order.source,
      },
    }),
  ]);

  return {
    ok: true,
    order: result.order,
    position: result.position,
  };
}

export async function markPositionsToMarket() {
  const positions = await prisma.position.findMany();

  await Promise.all(
    positions.map(async (position) => {
      const markPrice = await getMarkPrice("SIMULATED", position.instrument);
      const direction = position.side === "BUY" ? 1 : -1;
      const unrealizedPnlUsd = (markPrice - position.entryPrice) * position.quantity * direction;

      return prisma.position.update({
        where: { id: position.id },
        data: {
          markPrice,
          unrealizedPnlUsd,
          liquidationPrice:
            position.marketType === "PERPETUAL"
              ? estimateLiquidationPrice({
                  entryPrice: position.entryPrice,
                  leverage: position.leverage,
                  side: position.side,
                })
              : null,
        },
      });
    }),
  );
}

export async function settleFundingForOpenPositions(rate = 0.0001) {
  const positions = await prisma.position.findMany({
    where: { marketType: "PERPETUAL" },
  });

  await Promise.all(
    positions.map(async (position) => {
      const result = applyFunding(position.unrealizedPnlUsd, rate, position.quantity * position.markPrice);
      await prisma.fundingLedger.create({
        data: {
          portfolioId: position.portfolioId,
          instrument: position.instrument,
          amountUsd: result.fundingCost,
          rate,
        },
      });
    }),
  );
}

export async function liquidateBrokenPositions() {
  const positions = await prisma.position.findMany({
    where: {
      marketType: "PERPETUAL",
      liquidationPrice: { not: null },
    },
  });

  await Promise.all(
    positions.map(async (position) => {
      const shouldLiquidate =
        position.side === "BUY"
          ? position.markPrice <= (position.liquidationPrice ?? 0)
          : position.markPrice >= (position.liquidationPrice ?? Number.MAX_SAFE_INTEGER);

      if (!shouldLiquidate) {
        return null;
      }

      return prisma.$transaction(async (tx) => {
        await tx.liquidationEvent.create({
          data: {
            portfolioId: position.portfolioId,
            positionId: position.id,
            markPrice: position.markPrice,
            lossUsd: Math.abs(position.unrealizedPnlUsd),
          },
        });

        await tx.order.updateMany({
          where: {
            positionId: position.id,
            status: {
              in: ["OPEN", "PARTIALLY_FILLED"],
            },
          },
          data: {
            status: "LIQUIDATED",
          },
        });

        await tx.position.delete({
          where: { id: position.id },
        });
      });
    }),
  );
}

export type OrderWithRelations = Prisma.PromiseReturnType<typeof submitPaperOrder>;
