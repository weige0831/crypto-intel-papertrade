import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/crypto";
import { resetPasswordSchema } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = resetPasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Account not found",
        },
        { status: 404 },
      );
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        email: body.email,
        purpose: "RESET_PASSWORD",
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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Password reset succeeded",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to reset password",
      },
      { status: 400 },
    );
  }
}
