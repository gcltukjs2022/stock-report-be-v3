import axios from "axios";
import * as cheerio from "cheerio";

async function testAllTypes() {
  const codes = ["00005", "PDD", "688382"];

  for (const code of codes) {
    const url = `http://www.aastocks.com/tc/stocks/analysis/stock-aafn/${code}/0/all/1`;
    console.log(`[TEST AASTOCKS] Code: ${code} | URL: ${url}`);

    try {
      const { data: html } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(html);
      const divRef = $("div[ref]");
      console.log(`  -> Found news items count: ${divRef.length}`);

      divRef.slice(0, 3).each((i, el) => {
        const title = $(el).find(".newshead4 a").text().trim();
        const href = $(el).find(".newshead4 a").attr("href") || "";
        const dataNt = $(el).find(".div_VoteTotal").attr("data-nt");
        console.log(`     Item #${i + 1}: Title="${title}" | date=${dataNt}`);
      });
    } catch (err: any) {
      console.error(`  -> Error: ${err.message}`);
    }
  }
}

testAllTypes();
