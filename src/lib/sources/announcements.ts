import { load } from "cheerio";
import Parser from "rss-parser";

import { extractSymbolsFromText } from "@/lib/market/normalize";
import type { IntelItem } from "@/lib/sources/types";

const rssParser = new Parser();

async function parseHtmlAnnouncements(url: string, sourceName: string): Promise<IntelItem[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CryptoIntelBot/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceName} announcements`);
  }

  const html = await response.text();
  const $ = load(html);
  const items: IntelItem[] = [];

  $("a").each((_, element) => {
    if (items.length >= 12) {
      return false;
    }

    const title = $(element).text().replace(/\s+/g, " ").trim();
    const href = $(element).attr("href");

    if (!title || !href || title.length < 12) {
      return;
    }

    const absoluteUrl = href.startsWith("http") ? href : new URL(href, url).toString();

    items.push({
      sourceName,
      sourceType: "EXCHANGE",
      title,
      summary: title,
      url: absoluteUrl,
      symbols: extractSymbolsFromText(title),
      category: "announcement",
      publishedAt: new Date(),
    });
  });

  return items;
}

export async function fetchBinanceAnnouncements() {
  return parseHtmlAnnouncements("https://www.binance.com/en/support/announcement", "Binance");
}

export async function fetchOkxAnnouncements() {
  return parseHtmlAnnouncements("https://www.okx.com/help", "OKX");
}

export async function fetchRssFeed(url: string, sourceName: string) {
  const feed = await rssParser.parseURL(url);

  return (feed.items ?? []).slice(0, 12).map((item) => ({
    sourceName,
    sourceType: "RSS" as const,
    title: item.title ?? "Untitled",
    summary: item.contentSnippet ?? item.content ?? undefined,
    url: item.link ?? item.guid ?? "",
    language: feed.language ?? "en-US",
    symbols: extractSymbolsFromText(`${item.title ?? ""} ${item.contentSnippet ?? ""}`),
    category: "news",
    publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
  }));
}

export async function collectIntelFeeds() {
  const [binance, okx, rss] = await Promise.allSettled([
    fetchBinanceAnnouncements(),
    fetchOkxAnnouncements(),
    fetchRssFeed("https://www.coindesk.com/arc/outboundfeeds/rss/", "CoinDesk RSS"),
  ]);

  return [binance, okx, rss].flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
