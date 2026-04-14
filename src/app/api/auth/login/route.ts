import { NextResponse } from "next/server";

import { attachSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { loginSchema } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
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

    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid password",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Signed in",
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
      locale: user.preferredLocale as "zh-CN" | "en-US",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Login failed",
      },
      { status: 400 },
    );
  }
}
