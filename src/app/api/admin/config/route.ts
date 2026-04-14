import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { adminConfigSchema } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/server/audit";

export async function GET() {
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

  const config = await prisma.adminConfig.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({
    ok: true,
    config,
  });
}

export async function POST(request: Request) {
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

  try {
    const body = adminConfigSchema.parse(await request.json());

    const config = await prisma.adminConfig.upsert({
      where: { id: "singleton" },
      update: {
        siteName: body.siteName,
        defaultLocale: body.defaultLocale,
        smtpHost: body.smtpHost,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPasswordEnc: body.smtpPassword ? encryptSecret(body.smtpPassword) : undefined,
        smtpFromEmail: body.smtpFromEmail,
        smtpFromName: body.smtpFromName,
        githubOwner: body.githubOwner,
        githubRepo: body.githubRepo,
        ghcrImage: body.ghcrImage,
        updateChannel: body.updateChannel,
        maintenanceMode: body.maintenanceMode,
      },
      create: {
        id: "singleton",
        siteName: body.siteName,
        defaultLocale: body.defaultLocale,
        smtpHost: body.smtpHost,
        smtpPort: body.smtpPort,
        smtpUser: body.smtpUser,
        smtpPasswordEnc: body.smtpPassword ? encryptSecret(body.smtpPassword) : undefined,
        smtpFromEmail: body.smtpFromEmail,
        smtpFromName: body.smtpFromName,
        githubOwner: body.githubOwner,
        githubRepo: body.githubRepo,
        ghcrImage: body.ghcrImage,
        updateChannel: body.updateChannel,
        maintenanceMode: body.maintenanceMode,
      },
    });

    await recordAudit({
      userId: session.sub,
      action: "admin.config.updated",
      targetType: "AdminConfig",
      targetId: config.id,
    });

    return NextResponse.json({
      ok: true,
      message: "Admin configuration saved",
      config,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Failed to save admin configuration",
      },
      { status: 400 },
    );
  }
}
