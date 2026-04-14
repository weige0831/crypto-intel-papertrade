import { NextResponse } from "next/server";

import { attachSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { DEFAULT_USER_PROMPT } from "@/lib/constants";
import { registerSchema } from "@/lib/domain";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: body.email,
        purpose: "REGISTER",
        code: body.code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        {
          ok: false,
          message: "Verification code is invalid or expired",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName,
        preferredLocale: body.locale,
        emailVerifiedAt: new Date(),
        portfolios: {
          create: {
            name: "Primary Paper Account",
            isPrimary: true,
            totalEquityUsd: 10000,
            balances: {
              create: {
                asset: "USDT",
                marketType: "SPOT",
                available: 10000,
              },
            },
          },
        },
        aiConfigs: {
          create: {
            name: "personal-default",
            scope: "USER",
            baseUrl: env.OPENAI_COMPAT_BASE_URL,
            apiKeyEnc: "",
            model: env.OPENAI_COMPAT_MODEL,
            systemPrompt: DEFAULT_USER_PROMPT,
            maxPositionUsd: 100,
            allowedMarkets: ["SPOT", "PERPETUAL"],
            riskLimits: {
              maxLeverage: 3,
              dailyLossLimitUsd: 500,
            },
            isEnabled: false,
          },
        },
      },
    });

    await prisma.emailVerificationCode.update({
      where: { id: verification.id },
      data: {
        consumedAt: new Date(),
      },
    });

    const response = NextResponse.json({
      ok: true,
      message: "Registration succeeded",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    await attachSessionCookie(response, {
      sub: user.id,
      email: user.email,
      role: user.role,
      locale: body.locale,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Registration failed",
      },
      { status: 400 },
    );
  }
}
