import { PrismaClient, UserRole, VerificationPurpose } from "@prisma/client";

import { encryptSecret, hashPassword } from "@/lib/crypto";
import { env } from "@/lib/env";

const prisma = new PrismaClient();

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
      preferredLocale: env.DEFAULT_LOCALE,
      isActive: true,
    },
    create: {
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
      preferredLocale: env.DEFAULT_LOCALE,
      displayName: "Super Admin",
    },
  });

  await prisma.portfolio.upsert({
    where: { id: `${admin.id}-primary` },
    update: {},
    create: {
      id: `${admin.id}-primary`,
      userId: admin.id,
      name: "Primary Paper Account",
      isPrimary: true,
      totalEquityUsd: 10000,
    },
  });
}

async function main() {
  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: {
      githubOwner: env.GITHUB_OWNER,
      githubRepo: env.GITHUB_REPO,
      ghcrImage: env.GHCR_IMAGE,
      updateChannel: env.UPDATE_CHANNEL,
    },
    create: {
      id: "singleton",
      siteName: env.APP_NAME,
      defaultLocale: env.DEFAULT_LOCALE,
      githubOwner: env.GITHUB_OWNER,
      githubRepo: env.GITHUB_REPO,
      ghcrImage: env.GHCR_IMAGE,
      updateChannel: env.UPDATE_CHANNEL,
      riskDefaults: {
        maxOpenPositions: 8,
        defaultLeverage: 3,
        dailyLossLimitUsd: 500,
      },
      siteSettings: {
        supportedLocales: ["zh-CN", "en-US"],
      },
    },
  });

  await prisma.sourceConfig.createMany({
    data: [
      {
        name: "binance-announcements",
        kind: "EXCHANGE",
        enabled: true,
        baseUrl: "https://www.binance.com/en/support/announcement",
        options: { exchange: "BINANCE", parser: "html" },
      },
      {
        name: "okx-announcements",
        kind: "EXCHANGE",
        enabled: true,
        baseUrl: "https://www.okx.com/help",
        options: { exchange: "OKX", parser: "html" },
      },
      {
        name: "crypto-rss",
        kind: "RSS",
        enabled: true,
        baseUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
        options: { language: "en-US" },
      },
    ],
    skipDuplicates: true,
  });

  if (env.OPENAI_COMPAT_API_KEY) {
    await prisma.aiProviderConfig
      .create({
        data: {
          scope: "GLOBAL",
          name: "global-default",
          baseUrl: env.OPENAI_COMPAT_BASE_URL,
          apiKeyEnc: encryptSecret(env.OPENAI_COMPAT_API_KEY),
          model: env.OPENAI_COMPAT_MODEL,
          systemPrompt:
            "You are the AI trading copilot for a paper trading platform. Use news, exchange notices, and market volatility to form structured trade intents. Never exceed configured risk limits.",
          maxPositionUsd: 100,
          allowedMarkets: ["SPOT", "PERPETUAL"],
          riskLimits: {
            maxLeverage: 5,
            dailyLossLimitUsd: 500,
          },
          isEnabled: false,
        },
      })
      .catch(() => null);
  }

  await seedAdmin();

  await prisma.emailVerificationCode.deleteMany({
    where: {
      purpose: VerificationPurpose.LOGIN,
      expiresAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
    },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
