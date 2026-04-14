import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth";
import { submitPaperOrder } from "@/lib/server/trading";

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
    const result = await submitPaperOrder(session.sub, await request.json());

    return NextResponse.json({
      ok: result.ok,
      message: result.ok ? "Order executed" : result.reason,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to place paper order",
      },
      { status: 400 },
    );
  }
}
