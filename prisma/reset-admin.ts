import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ensureAdminAccount } from "@/lib/server/admin";

async function main() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const admin = await ensureAdminAccount({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  });

  console.info(`Admin account reset: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Admin reset failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
