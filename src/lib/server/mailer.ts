import nodemailer from "nodemailer";

import { env } from "@/lib/env";

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM_EMAIL);
}

function getMessageCopy(locale: "zh-CN" | "en-US", purpose: "REGISTER" | "LOGIN" | "RESET_PASSWORD") {
  if (locale === "zh-CN") {
    if (purpose === "RESET_PASSWORD") {
      return {
        subject: "Crypto Intel 密码重置验证码",
        html: (code: string) =>
          `<p>你的密码重置验证码是 <strong>${code}</strong>。</p><p>该验证码 10 分钟内有效。</p>`,
      };
    }

    if (purpose === "LOGIN") {
      return {
        subject: "Crypto Intel 登录验证码",
        html: (code: string) =>
          `<p>你的登录验证码是 <strong>${code}</strong>。</p><p>该验证码 10 分钟内有效。</p>`,
      };
    }

    return {
      subject: "Crypto Intel 注册验证码",
      html: (code: string) =>
        `<p>你的注册验证码是 <strong>${code}</strong>。</p><p>该验证码 10 分钟内有效。</p>`,
    };
  }

  if (purpose === "RESET_PASSWORD") {
    return {
      subject: "Crypto Intel password reset code",
      html: (code: string) =>
        `<p>Your password reset code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    };
  }

  if (purpose === "LOGIN") {
    return {
      subject: "Crypto Intel login code",
      html: (code: string) =>
        `<p>Your login code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    };
  }

  return {
    subject: "Crypto Intel registration code",
    html: (code: string) =>
      `<p>Your registration code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  };
}

export async function sendVerificationEmail(input: {
  email: string;
  code: string;
  locale: "zh-CN" | "en-US";
  purpose: "REGISTER" | "LOGIN" | "RESET_PASSWORD";
}) {
  const copy = getMessageCopy(input.locale, input.purpose);

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
    subject: copy.subject,
    html: copy.html(input.code),
  });

  return {
    delivered: true,
  };
}
