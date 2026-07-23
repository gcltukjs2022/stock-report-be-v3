import { chromium } from "playwright";
import * as cheerio from "cheerio";

async function testUnblocked() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  const url = "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005";

  console.log(`[TEST UNBLOCKED] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log("Goto warning:", e.message));

  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log(`Rendered HTML length: ${html.length}`);

  const $ = cheerio.load(html);
  const containers = $("#aafn-search-c1 div[ref]");
  console.log(`Found #aafn-search-c1 div[ref]: ${containers.length}`);

  containers.each((i, el) => {
    const container = $(el);
    const titleAnchor = container.find(".newshead4 a").first();
    const title = titleAnchor.text().trim();
    const href = titleAnchor.attr("href") || "";
    console.log(`Item #${i + 1}: Title="${title}" | Href="${href}"`);
  });

  if (containers.length === 0) {
    console.log("Searching all anchors in page...");
    const anchors = $("a[href]");
    console.log(`Total anchors: ${anchors.length}`);
    anchors.each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (text.length > 5 && (href.includes("news") || href.includes("HK6") || href.includes("express"))) {
        console.log(`Anchor #${i + 1}: Text="${text}" | Href="${href}"`);
      }
    });
  }

  await browser.close();
}

testUnblocked();
