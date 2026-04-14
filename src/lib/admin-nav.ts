import type { AppLocale } from "@/lib/constants";

export function getAdminLinks(locale: AppLocale) {
  const isZh = locale === "zh-CN";
  const query = `?lang=${locale}`;

  return [
    { href: `/admin${query}`, label: isZh ? "概览" : "Overview" },
    { href: `/admin/config${query}`, label: isZh ? "配置" : "Config" },
    { href: `/admin/sources${query}`, label: isZh ? "源状态" : "Sources" },
    { href: `/admin/users${query}`, label: isZh ? "用户" : "Users" },
    { href: `/admin/update${query}`, label: isZh ? "更新" : "Update" },
    { href: `/admin/system${query}`, label: isZh ? "系统" : "System" },
  ];
}
