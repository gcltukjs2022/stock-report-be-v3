import axios from "axios";
import * as cheerio from "cheerio";
import { NewsItemWoArticle } from "../../types/news";

function formatToYYYYMMDD(raw: string): string {
  const datePart = raw.split(" ")[0];
  return datePart.replace(/\//g, "");
}

export function buildAastocksNewsUrl(aastocksCode: string): string {
  // Updated AAStocks stock news URL format
  return `http://www.aastocks.com/tc/stocks/analysis/stock-aafn/${aastocksCode}/0/all/1`;
}

export async function scrapeAastocksNewsList(
  url: string,
  stockName: string,
): Promise<NewsItemWoArticle[]> {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    const results: NewsItemWoArticle[] = [];

    // AAStocks news containers are div[ref] inside #aafn-search-c1 or root container
    $("div[ref]").each((_, el) => {
      const container = $(el);
      const titleAnchor = container.find(".newshead4 a").first();
      const title = titleAnchor.text().trim();
      let href = titleAnchor.attr("href") || "";
      if (href && !href.startsWith("http")) {
        href = `https://www.aastocks.com${href}`;
      }

      if (!title || !href) return;

      const dataNt = container.find(".div_VoteTotal").attr("data-nt");
      let dateRaw: string | null = null;
      let dateYYYYMMDD: string | null = null;

      if (dataNt && dataNt.length >= 8) {
        dateYYYYMMDD = dataNt.slice(0, 8);
        dateRaw = `${dataNt.slice(0, 4)}/${dataNt.slice(4, 6)}/${dataNt.slice(6, 8)} ${dataNt.slice(8, 10)}:${dataNt.slice(10, 12)}`;
      } else {
        const scriptText =
          container.find(".inline_block script").first().html() || "";
        const match = scriptText.match(
          /ConvertToLocalTime\(\{dt:\s*['"]([^'"]+)['"]\}\)/,
        );

        if (match) {
          dateRaw = match[1];
          dateYYYYMMDD = formatToYYYYMMDD(dateRaw);
        }
      }

      results.push({ stock: stockName, title, href, dateRaw, dateYYYYMMDD });
    });

    return results;
  } catch (err) {
    console.error(`[AAStocks] Failed to scrape news list for ${stockName}:`, err);
    return [];
  }
}

export async function scrapeAastocksArticleBody(url: string): Promise<string> {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    const container = $("#spanContent");

    if (container.length === 0) {
      return "";
    }

    const paragraphs = container
      .find("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 0);

    if (paragraphs.length === 0) {
      return container.text().trim();
    }

    return paragraphs.join("\n\n");
  } catch (err) {
    console.error(`[AAStocks] Failed to scrape article body for ${url}:`, err);
    return "";
  }
}
