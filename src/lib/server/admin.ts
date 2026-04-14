import { UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function ensureAdminAccount(input: { email: string; password: string }) {
  const passwordHash = await hashPassword(input.password);

  const admin = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
      preferredLocale: env.DEFAULT_LOCALE,
      isActive: true,
      displayName: "Super Admin",
    },
    create: {
      email: input.email,
      passwordHash,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
      preferredLocale: env.DEFAULT_LOCALE,
      displayName: "Super Admin",
      isActive: true,
    },
  });

  await prisma.portfolio.upsert({
    where: { id: `${admin.id}-primary` },
    update: {
      name: "Primary Paper Account",
      isPrimary: true,
    },
    create: {
      id: `${admin.id}-primary`,
      userId: admin.id,
      name: "Primary Paper Account",
      isPrimary: true,
      totalEquityUsd: 10000,
      balances: {
        create: {
          asset: "USDT",
          marketType: "SPOT",
          available: 10000,
        },
      },
    },
  });

  return admin;
}
