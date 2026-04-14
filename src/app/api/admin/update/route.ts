import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { triggerSystemUpdate } from "@/lib/server/update";

export async function POST() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const result = await triggerSystemUpdate(session.sub);

  return NextResponse.json({
    ok: result.status === "SUCCEEDED",
    message: result.message ?? "Update finished",
    result,
  });
}
