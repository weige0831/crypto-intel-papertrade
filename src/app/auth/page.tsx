import { redirect } from "next/navigation";

import { resolveLocale } from "@/lib/i18n";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const target = new URLSearchParams({ lang: locale });

  if (params.next) {
    target.set("next", params.next);
  }

  if (params.mode === "admin") {
    target.set("mode", "admin");
  }

  redirect(`/auth/login?${target.toString()}`);
}
