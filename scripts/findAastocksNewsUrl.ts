import axios from "axios";
import * as cheerio from "cheerio";

async function findUrl() {
  const quoteUrl = "http://www.aastocks.com/tc/stocks/quote/detail-quote.aspx?symbol=00005";
  console.log(`[FIND AAStocks News URL] Fetching quote page: ${quoteUrl}...`);

  try {
    const { data: html } = await axios.get(quoteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    console.log(`HTML Length: ${html.length}`);

    const anchors = $("a[href]");
    console.log(`Total anchors on quote page: ${anchors.length}`);

    anchors.each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (href.includes("news") || href.includes("search") || text.includes("新聞") || text.includes("消息")) {
        console.log(`  Anchor #${i + 1}: Text="${text}" | Href="${href}"`);
      }
    });

  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

findUrl();
