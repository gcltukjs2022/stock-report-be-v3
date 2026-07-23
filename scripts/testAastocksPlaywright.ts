import * as cheerio from "cheerio";
import { renderPage, closeBrowser } from "../src/scrapers/core/browser";
import { getAllowedDates } from "../src/utils/dateUtils";

async function testAastocksPlaywright() {
  const url = "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005";
  console.log(`[TEST AAStocks Playwright] Rendering ${url}...`);

  try {
    const html = await renderPage(url);
    const $ = cheerio.load(html);

    console.log(`[TEST AAStocks Playwright] Rendered HTML length: ${html.length}`);

    const containers = $("#aafn-search-c1 div[ref]");
    console.log(`[TEST AAStocks Playwright] Found #aafn-search-c1 div[ref] containers: ${containers.length}`);

    const allowedDates = getAllowedDates();
    console.log("[TEST AAStocks Playwright] Allowed dates set:", Array.from(allowedDates));

    containers.each((i, el) => {
      const container = $(el);
      const titleAnchor = container.find(".newshead4 a").first();
      const title = titleAnchor.text().trim();
      let href = titleAnchor.attr("href") || "";
      if (href && !href.startsWith("http")) {
        href = `https://www.aastocks.com${href}`;
      }

      const dataNt = container.find(".div_VoteTotal").attr("data-nt");
      let dateYYYYMMDD: string | null = null;
      if (dataNt && dataNt.length >= 8) {
        dateYYYYMMDD = dataNt.slice(0, 8);
      }

      console.log(`Item #${i + 1}: Title="${title}", dateYYYYMMDD=${dateYYYYMMDD}, Allowed=${dateYYYYMMDD ? allowedDates.has(dateYYYYMMDD) : false}`);
    });

  } finally {
    await closeBrowser();
  }
}

testAastocksPlaywright();
