import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, type AppLocale } from "@/lib/constants";
import { env } from "@/lib/env";

type SessionPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
  locale: AppLocale;
};

const secret = new TextEncoder().encode(env.AUTH_SECRET);

async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function attachSessionCookie(response: NextResponse, payload: SessionPayload) {
  const token = await signSession(payload);

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function requireAdminSession() {
  const session = await readSession();
  return session?.role === "ADMIN" ? session : null;
}
