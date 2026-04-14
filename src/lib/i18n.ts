import { APP_LOCALES, type AppLocale } from "@/lib/constants";

type Dictionary = {
  brand: string;
  tagline: string;
  nav: {
    home: string;
    market: string;
    paperTrading: string;
    aiSettings: string;
    alerts: string;
    login: string;
    register: string;
    languageZh: string;
    languageEn: string;
  };
  sections: {
    authCenter: string;
    liveMarket: string;
    paperEngine: string;
    aiControl: string;
    adminCenter: string;
  };
  common: {
    latest: string;
    realtime: string;
    language: string;
    guest: string;
    signedInAs: string;
    noData: string;
  };
};

const dictionaries: Record<AppLocale, Dictionary> = {
  "zh-CN": {
    brand: "Crypto Intel Papertrade",
    tagline: "面向消息面、行情与虚拟仓执行的一体化终端",
    nav: {
      home: "首页",
      market: "行情广场",
      paperTrading: "虚拟仓",
      aiSettings: "AI 配置",
      alerts: "消息中心",
      login: "登录",
      register: "注册",
      languageZh: "中文",
      languageEn: "English",
    },
    sections: {
      authCenter: "认证中心",
      liveMarket: "行情与消息",
      paperEngine: "虚拟仓执行台",
      aiControl: "AI 控制台",
      adminCenter: "管理员后台",
    },
    common: {
      latest: "最新",
      realtime: "实时",
      language: "语言",
      guest: "访客",
      signedInAs: "当前会话",
      noData: "暂无数据",
    },
  },
  "en-US": {
    brand: "Crypto Intel Papertrade",
    tagline: "An intelligence terminal for crypto news, market structure, and paper execution",
    nav: {
      home: "Home",
      market: "Markets",
      paperTrading: "Paper Trading",
      aiSettings: "AI Settings",
      alerts: "Intel Feed",
      login: "Sign in",
      register: "Register",
      languageZh: "中文",
      languageEn: "English",
    },
    sections: {
      authCenter: "Authentication",
      liveMarket: "Markets & Intel",
      paperEngine: "Paper Trading Desk",
      aiControl: "AI Control",
      adminCenter: "Admin Console",
    },
    common: {
      latest: "Latest",
      realtime: "Realtime",
      language: "Language",
      guest: "Guest",
      signedInAs: "Session",
      noData: "No data yet",
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
