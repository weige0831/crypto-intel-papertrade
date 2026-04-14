import { randomInt } from "node:crypto";

import { NextResponse } from "next/server";

import { emailCodeRequestSchema } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/server/mailer";

export async function POST(request: Request) {
  try {
    const body = emailCodeRequestSchema.parse(await request.json());
    const code = `${randomInt(100000, 999999)}`;

    if (body.purpose === "REGISTER") {
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          {
            ok: false,
            message: body.locale === "zh-CN" ? "该邮箱已注册" : "This email is already registered",
          },
          { status: 400 },
        );
      }
    }

    if (body.purpose === "RESET_PASSWORD") {
      const existing = await prisma.user.findUnique({
        where: { email: body.email },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json(
          {
            ok: false,
            message: "Account not found",
          },
          { status: 404 },
        );
      }
    }

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
      locale: body.locale,
      purpose: body.purpose,
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
