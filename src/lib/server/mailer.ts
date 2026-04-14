import nodemailer from "nodemailer";

import { env } from "@/lib/env";

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM_EMAIL);
}

export async function sendVerificationEmail(input: {
  email: string;
  code: string;
  locale: "zh-CN" | "en-US";
}) {
  const subject =
    input.locale === "zh-CN"
      ? `你的 Crypto Intel 验证码：${input.code}`
      : `Your Crypto Intel verification code: ${input.code}`;

  const html =
    input.locale === "zh-CN"
      ? `<p>你的验证码是 <strong>${input.code}</strong>，10 分钟内有效。</p>`
      : `<p>Your verification code is <strong>${input.code}</strong>. It expires in 10 minutes.</p>`;

  if (!hasSmtpConfig()) {
    console.info(`[mail-preview] ${input.email} => ${input.code}`);
    return {
      delivered: false,
      previewCode: process.env.NODE_ENV !== "production" ? input.code : undefined,
    };
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        }
      : undefined,
  });

  await transport.sendMail({
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
    to: input.email,
    subject,
    html,
  });

  return {
    delivered: true,
  };
}
