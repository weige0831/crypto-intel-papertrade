"use client";

import { useEffect, useRef } from "react";

export function TradingViewEmbed({
  symbol,
  locale,
}: {
  symbol: string | null;
  locale: "zh-CN" | "en-US";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !symbol) {
      return;
    }

    containerRef.current.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widget);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Asia/Shanghai",
      theme: "dark",
      style: "1",
      locale: locale === "zh-CN" ? "zh_CN" : "en",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    containerRef.current.appendChild(script);
  }, [locale, symbol]);

  if (!symbol) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-400">
        {locale === "zh-CN"
          ? "当前没有可用于图表嵌入的现货符号。请先等待行情采集完成，或切换到存在现货行情的币种。"
          : "No spot symbol is currently available for chart embedding. Wait for market ingestion or switch to an instrument with spot data."}
      </div>
    );
  }

  return (
    <div className="tradingview-widget-container min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40">
      <div ref={containerRef} className="h-[520px] w-full" />
    </div>
  );
}
