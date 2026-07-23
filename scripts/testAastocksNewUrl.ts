import axios from "axios";
import * as cheerio from "cheerio";

async function testNewUrl() {
  const stockCode = "00005";
  const newUrl = `http://www.aastocks.com/tc/stocks/analysis/stock-aafn/${stockCode}/0/hk-stock-news/1`;
  console.log(`[TEST AASTOCKS NEW URL] Fetching: ${newUrl}...`);

  try {
    const { data: html } = await axios.get(newUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    console.log(`Rendered HTML length: ${html.length}`);

    // Try finding div[ref] or news containers
    const divRef = $("div[ref]");
    const aafnContainers = $("#aafn-search-c1 div[ref], div.newshead4, div[id*='aafn']");

    console.log(`Found div[ref] count: ${divRef.length}`);
    console.log(`Found aafnContainers count: ${aafnContainers.length}`);

    // Inspect anchors inside news section
    const newsAnchors = $("a[href*='news.aspx'], a[href*='HK6'], a[href*='aafns'], a[href*='commentary']");
    console.log(`Found news anchors count: ${newsAnchors.length}`);

    divRef.each((i, el) => {
      const container = $(el);
      const titleAnchor = container.find(".newshead4 a").first();
      const title = titleAnchor.text().trim();
      const href = titleAnchor.attr("href") || "";
      const dataNt = container.find(".div_VoteTotal").attr("data-nt");

      console.log(`News Item #${i + 1}: Title="${title}" | Href="${href}" | data-nt="${dataNt}"`);
    });

    if (divRef.length === 0) {
      console.log("Printing sample anchors with href:");
      $("a[href]").slice(0, 30).each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href") || "";
        if (text.length > 3) {
          console.log(`  Anchor #${i + 1}: Text="${text}" | Href="${href}"`);
        }
      });
    }

  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testNewUrl();
