import { redirect } from "next/navigation";

import { readSession } from "@/lib/auth";
import { type AppLocale } from "@/lib/constants";

type AuthMode = "user" | "admin";

export function withLang(pathname: string, locale: AppLocale) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}lang=${locale}`;
}

export function buildAuthHref(locale: AppLocale, nextPath: string, mode: AuthMode = "user") {
  const params = new URLSearchParams({
    lang: locale,
    next: nextPath,
  });

  if (mode === "admin") {
    params.set("mode", "admin");
  }

  return `/auth?${params.toString()}`;
}

export async function requireUserPageSession(locale: AppLocale, pathname: string) {
  const session = await readSession();

  if (!session) {
    redirect(buildAuthHref(locale, withLang(pathname, locale)));
  }

  return session;
}

export async function requireAdminPageSession(locale: AppLocale, pathname: string) {
  const session = await readSession();

  if (!session || session.role !== "ADMIN") {
    redirect(buildAuthHref(locale, withLang(pathname, locale), "admin"));
  }

  return session;
}
