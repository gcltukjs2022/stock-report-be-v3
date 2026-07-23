import * as cheerio from "cheerio";
import { renderPage, closeBrowser } from "../src/scrapers/core/browser";

async function testUrls() {
  const candidateUrls = [
    "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005",
    "https://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005",
    "https://www.aastocks.com/tc/stocks/analysis/company-fundamental/company-news?symbol=00005",
    "https://www.aastocks.com/tc/stocks/news/aafns/00005",
  ];

  try {
    for (const url of candidateUrls) {
      console.log(`\n==========================================`);
      console.log(`[TESTING URL] ${url}`);
      const html = await renderPage(url);
      const $ = cheerio.load(html);
      console.log(`HTML Length: ${html.length}`);

      // Count news item elements
      const newsItems1 = $("#aafn-search-c1 div[ref]");
      const newsItems2 = $("div[ref]");
      const newsAnchors = $("a[href*='news.aspx'], a[href*='news/aafns'], a[href*='HK6']");
      const allAnchors = $("a[href]");

      console.log(`Selector #aafn-search-c1 div[ref]: ${newsItems1.length}`);
      console.log(`Selector div[ref]: ${newsItems2.length}`);
      console.log(`News anchors count: ${newsAnchors.length}`);
      console.log(`Total anchors count: ${allAnchors.length}`);

      if (allAnchors.length > 0) {
        console.log("Sample 3 anchors:");
        allAnchors.slice(0, 5).each((_, el) => {
          console.log(`  - Text="${$(el).text().trim()}" | Href="${$(el).attr("href")}"`);
        });
      }
    }
  } finally {
    await closeBrowser();
  }
}

testUrls();
