import axios from "axios";
import * as cheerio from "cheerio";

async function testSymbols() {
  const testUrls = [
    "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005",
    "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=0005",
    "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=5",
    "http://www.aastocks.com/tc/stocks/analysis/stocknews.aspx?symbol=00005&s=2&o=1",
    "http://www.aastocks.com/tc/stocks/news/aafns/00005",
    "http://www.aastocks.com/tc/stocks/news/aafns",
  ];

  for (const url of testUrls) {
    try {
      const res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
        },
        maxRedirects: 5,
        timeout: 10000,
      });

      const html = res.data;
      const $ = cheerio.load(html);

      const divRef = $("div[ref]").length;
      const aafnDiv = $("#aafn-search-c1").length;
      const allAnchors = $("a[href]").length;

      console.log(`URL: ${url}`);
      console.log(`  -> Status: ${res.status} | Final URL: ${res.request.res.responseUrl || url}`);
      console.log(`  -> HTML Length: ${html.length} | #aafn-search-c1: ${aafnDiv} | div[ref]: ${divRef} | Total Anchors: ${allAnchors}`);

      if (divRef > 0) {
        console.log("  *** SUCCESS! Found div[ref] news containers! ***");
        $("div[ref]").slice(0, 3).each((i, el) => {
          const title = $(el).find(".newshead4 a").text().trim();
          console.log(`    Item #${i + 1}: ${title}`);
        });
      }
    } catch (err: any) {
      console.log(`URL: ${url} -> ERROR: ${err.message}`);
    }
  }
}

testSymbols();
