import { prisma } from "@/lib/prisma";

export async function recordAudit(input: {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  payload?: unknown;
}) {
  return prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        payload: input.payload as object | undefined,
      },
    })
    .catch(() => null);
}
