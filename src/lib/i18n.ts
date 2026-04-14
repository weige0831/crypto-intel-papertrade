import { APP_LOCALES, type AppLocale } from "@/lib/constants";

type Dictionary = {
  brand: string;
  tagline: string;
  nav: {
    home: string;
    auth: string;
    market: string;
    paperTrading: string;
    aiSettings: string;
    alerts: string;
    admin: string;
  };
  home: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    highlights: string[];
  };
  sections: {
    liveMarket: string;
    paperEngine: string;
    aiControl: string;
    adminCenter: string;
    authCenter: string;
  };
  common: {
    submit: string;
    save: string;
    signOut: string;
    language: string;
    sourceStatus: string;
    realtime: string;
    latest: string;
  };
};

const dictionaries: Record<AppLocale, Dictionary> = {
  "zh-CN": {
    brand: "Crypto Intel Papertrade",
    tagline: "面向虚拟仓与实时消息面的加密情报平台",
    nav: {
      home: "总览",
      auth: "登录 / 注册",
      market: "市场情报",
      paperTrading: "虚拟仓",
      aiSettings: "AI 配置",
      alerts: "提醒中心",
      admin: "管理员后台",
    },
    home: {
      title: "把交易所公告、实时行情、外部消息面和 AI 虚拟交易控制集中到一个平台。",
      subtitle:
        "面向 Binance、OKX 和可扩展新闻源的情报系统，支持邮箱验证码注册、现货与永续虚拟仓、AI 自动开仓，以及管理员一键更新。",
      primaryCta: "进入市场情报",
      secondaryCta: "查看提醒中心",
      highlights: ["Binance + OKX 全市场监控", "现货 / 永续虚拟仓", "兼容 OpenAI 风格接口", "GitHub + GHCR 自动更新"],
    },
    sections: {
      liveMarket: "实时市场流",
      paperEngine: "虚拟交易引擎",
      aiControl: "AI 控制台",
      adminCenter: "管理员中心",
      authCenter: "认证中心",
    },
    common: {
      submit: "提交",
      save: "保存",
      signOut: "退出登录",
      language: "语言",
      sourceStatus: "数据源状态",
      realtime: "实时",
      latest: "最新",
    },
  },
  "en-US": {
    brand: "Crypto Intel Papertrade",
    tagline: "Realtime intelligence for paper crypto execution",
    nav: {
      home: "Overview",
      auth: "Sign in / Register",
      market: "Market Intel",
      paperTrading: "Paper Trading",
      aiSettings: "AI Settings",
      alerts: "Alerts",
      admin: "Admin",
    },
    home: {
      title: "One control plane for exchange news, live market structure, and AI-driven paper execution.",
      subtitle:
        "A Binance + OKX intelligence platform with email onboarding, spot and perpetual simulation, AI auto-trading, and admin-controlled updates.",
      primaryCta: "Open Market Intel",
      secondaryCta: "Open Alerts",
      highlights: ["Binance + OKX monitoring", "Spot / perpetual simulation", "OpenAI-compatible AI gateway", "GitHub + GHCR updates"],
    },
    sections: {
      liveMarket: "Live Market Stream",
      paperEngine: "Paper Engine",
      aiControl: "AI Control",
      adminCenter: "Admin Center",
      authCenter: "Authentication",
    },
    common: {
      submit: "Submit",
      save: "Save",
      signOut: "Sign out",
      language: "Language",
      sourceStatus: "Source status",
      realtime: "Realtime",
      latest: "Latest",
    },
  },
};

export function resolveLocale(candidate?: string | null): AppLocale {
  if (!candidate) {
    return "zh-CN";
  }

  return APP_LOCALES.includes(candidate as AppLocale) ? (candidate as AppLocale) : "zh-CN";
}

export function getDictionary(locale?: string | null) {
  return dictionaries[resolveLocale(locale)];
}
