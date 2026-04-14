import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "crypto-intel-papertrade",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
}
