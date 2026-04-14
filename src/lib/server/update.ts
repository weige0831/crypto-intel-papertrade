import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { runtimeEventSchema } from "@/lib/domain";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { publishRuntimeEvent } from "@/lib/server/bus";
import { recordAudit } from "@/lib/server/audit";

const execFileAsync = promisify(execFile);

export async function triggerSystemUpdate(requestedById?: string) {
  const updateLog = await prisma.systemUpdateLog.create({
    data: {
      requestedById,
      status: "RUNNING",
      startedAt: new Date(),
      message: "Update requested from admin console",
    },
  });

  if (!env.ALLOW_SYSTEM_UPDATE) {
    const blocked = await prisma.systemUpdateLog.update({
      where: { id: updateLog.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message: "ALLOW_SYSTEM_UPDATE=false, refusing to execute update script",
      },
    });

    return blocked;
  }

  if (process.platform === "win32") {
    const unsupported = await prisma.systemUpdateLog.update({
      where: { id: updateLog.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message: "System updates are only supported on Linux deployment targets",
      },
    });

    return unsupported;
  }

  try {
    const { stdout, stderr } = await execFileAsync("sh", [env.UPDATE_SCRIPT_PATH], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 1000 * 60 * 10,
      maxBuffer: 1024 * 1024 * 5,
    });

    const finished = await prisma.systemUpdateLog.update({
      where: { id: updateLog.id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        message: `${stdout}\n${stderr}`.trim().slice(-2000),
      },
    });

    await Promise.all([
      publishRuntimeEvent(
        runtimeEventSchema.parse({
          type: "system_update_status",
          payload: {
            status: finished.status,
            updateId: finished.id,
            message: finished.message,
          },
          createdAt: new Date().toISOString(),
        }),
      ),
      recordAudit({
        userId: requestedById,
        action: "system.update",
        targetType: "SystemUpdateLog",
        targetId: finished.id,
        payload: {
          status: finished.status,
        },
      }),
    ]);

    return finished;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown update error";

    const failed = await prisma.systemUpdateLog.update({
      where: { id: updateLog.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        message,
      },
    });

    await publishRuntimeEvent(
      runtimeEventSchema.parse({
        type: "system_update_status",
        payload: {
          status: failed.status,
          updateId: failed.id,
          message: failed.message,
        },
        createdAt: new Date().toISOString(),
      }),
    );

    return failed;
  }
}
