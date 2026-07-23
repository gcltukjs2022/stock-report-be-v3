import * as cheerio from "cheerio";
import { renderPage, closeBrowser } from "../src/scrapers/core/browser";

async function inspectDom() {
  const url = "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005";
  console.log(`[INSPECT AAStocks] Rendering ${url}...`);

  try {
    const html = await renderPage(url);
    const $ = cheerio.load(html);

    console.log("Searching for news links containing '/news/' or '/HK6/' or 'news'...");

    const links = $("a[href*='news'], a[href*='HK6'], a[href*='AAF']");
    console.log(`Found ${links.length} matching anchor links:`);

    links.each((i, el) => {
      const a = $(el);
      const text = a.text().trim();
      const href = a.attr("href");
      if (text.length > 5) {
        console.log(`Anchor #${i + 1}: Text="${text}" | Href="${href}"`);
      }
    });

    console.log("\nSearching for news container divs...");
    $("div").each((i, el) => {
      const id = $(el).attr("id") || "";
      const cls = $(el).attr("class") || "";
      if (id.includes("news") || cls.includes("news") || id.includes("aafn") || cls.includes("aafn")) {
        console.log(`Div #${i + 1}: id="${id}", class="${cls}"`);
      }
    });

  } finally {
    await closeBrowser();
  }
}

inspectDom();
