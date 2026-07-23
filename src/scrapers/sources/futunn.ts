import * as cheerio from "cheerio";
import { renderPage } from "../core/browser";
import { extractArticle } from "../core/extractor";
import { normalizeFutunnTime } from "../../utils/dateUtils";
import { NewsItemWoArticle } from "../../types/news";

export async function scrapeFutunnNewsList(
  url: string,
  stockName: string,
): Promise<NewsItemWoArticle[]> {
  try {
    const html = await renderPage(url);
    const $ = cheerio.load(html);
    const results: NewsItemWoArticle[] = [];

    const newsSection = $("section.stock-news").first();
    if (newsSection.length === 0) {
      console.warn(`[Futunn] No news section found for ${stockName} (${url})`);
      return [];
    }

    newsSection.find("ul.news-box > li.news-item").each((_, el) => {
      const item = $(el);
      const aTag = item.find("a[href]").first();
      if (!aTag.length || aTag.attr("rel") === "nofollow") return;

      const title = aTag.find("p.news-title").text().trim();
      let href = aTag.attr("href") ?? "";
      if (href && !href.startsWith("http")) {
        href = `https://news.futunn.com${href}`;
      }

      if (!title || !href) return;

      const timeText = aTag
        .find("p.news-meta span")
        .last()
        .text()
        .trim()
        .replace(/[^0-9/: ]/g, "");

      const { dateRaw, dateYYYYMMDD } = normalizeFutunnTime(timeText);

      results.push({
        stock: stockName,
        title,
        href,
        dateRaw,
        dateYYYYMMDD,
      });
    });

    return results;
  } catch (err) {
    console.error(`[Futunn] Failed to scrape news list for ${stockName}:`, err);
    return [];
  }
}

export async function scrapeFutunnArticleBody(url: string): Promise<string> {
  try {
    const html = await renderPage(url);
    const extracted = extractArticle(html, url);

    if (extracted.content && extracted.content.trim().length > 0) {
      return extracted.content.trim();
    }

    console.warn(`[Futunn] Readability returned empty body for ${url}`);
    return "";
  } catch (err) {
    console.error(`[Futunn] Failed to scrape article body for ${url}:`, err);
    return "";
  }
}
