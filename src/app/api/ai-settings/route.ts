import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth";
import { aiSettingsSchema } from "@/lib/domain";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/server/audit";

export async function POST(request: Request) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const body = aiSettingsSchema.parse(await request.json());

    const config = await prisma.aiProviderConfig.upsert({
      where: {
        id:
          (
            await prisma.aiProviderConfig.findFirst({
              where: { userId: session.sub },
              select: { id: true },
            })
          )?.id ?? `missing-${session.sub}`,
      },
      update: {
        baseUrl: body.baseUrl,
        apiKeyEnc: encryptSecret(body.apiKey),
        model: body.model,
        systemPrompt: body.systemPrompt,
        maxPositionUsd: body.maxPositionUsd,
        allowedMarkets: body.allowedMarkets,
        riskLimits: {
          maxLeverage: body.maxLeverage,
          dailyLossLimitUsd: body.dailyLossLimitUsd,
        },
        isEnabled: body.enabled,
      },
      create: {
        userId: session.sub,
        scope: "USER",
        name: "personal-default",
        baseUrl: body.baseUrl,
        apiKeyEnc: encryptSecret(body.apiKey),
        model: body.model,
        systemPrompt: body.systemPrompt,
        maxPositionUsd: body.maxPositionUsd,
        allowedMarkets: body.allowedMarkets,
        riskLimits: {
          maxLeverage: body.maxLeverage,
          dailyLossLimitUsd: body.dailyLossLimitUsd,
        },
        isEnabled: body.enabled,
      },
    });

    await recordAudit({
      userId: session.sub,
      action: "ai.config.updated",
      targetType: "AiProviderConfig",
      targetId: config.id,
    });

    return NextResponse.json({
      ok: true,
      message: "AI settings saved",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save AI settings",
      },
      { status: 400 },
    );
  }
}
