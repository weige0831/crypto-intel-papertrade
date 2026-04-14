import { randomInt } from "node:crypto";

import { NextResponse } from "next/server";

import { emailCodeRequestSchema } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/server/mailer";

export async function POST(request: Request) {
  try {
    const body = emailCodeRequestSchema.parse(await request.json());
    const code = `${randomInt(100000, 999999)}`;

    await prisma.emailVerificationCode.create({
      data: {
        email: body.email,
        code,
        purpose: body.purpose,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      },
    });

    const result = await sendVerificationEmail({
      email: body.email,
      code,
      locale: "zh-CN",
    });

    return NextResponse.json({
      ok: true,
      message: "Verification code issued",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to request verification code",
      },
      { status: 400 },
    );
  }
}
