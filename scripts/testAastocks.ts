import axios from "axios";
import * as cheerio from "cheerio";
import { buildAastocksNewsUrl } from "../src/scrapers/sources/aastocks";
import { getAllowedDates } from "../src/utils/dateUtils";

async function testAastocks() {
  const stockCode = "00005";
  const url = buildAastocksNewsUrl(stockCode);
  console.log(`[TEST AAStocks] Fetching ${url}...`);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    console.log(`[TEST AAStocks] HTML length: ${html.length}`);

    const containers = $("#aafn-search-c1 div[ref]");
    console.log(`[TEST AAStocks] Found #aafn-search-c1 div[ref] containers: ${containers.length}`);

    if (containers.length === 0) {
      console.log("[TEST AAStocks] No #aafn-search-c1 div[ref] found. Searching for alternative containers...");
      const allNews = $(".newshead4, .newshead5, .news-item, .div_VoteTotal");
      console.log(`[TEST AAStocks] Found alternative news selectors count: ${allNews.length}`);
      
      // Print snippets of news section
      const newsSection = $("#aafn-search-c1").html() || $("body").html() || "";
      console.log("[TEST AAStocks] Snippet of news area:\n", newsSection.slice(0, 1500));
    }

    const allowedDates = getAllowedDates();
    console.log("[TEST AAStocks] Allowed dates set:", Array.from(allowedDates));

    containers.each((i, el) => {
      const container = $(el);
      const titleAnchor = container.find(".newshead4 a").first();
      const title = titleAnchor.text().trim();
      const href = titleAnchor.attr("href") || "";
      const dataNt = container.find(".div_VoteTotal").attr("data-nt");

      let dateYYYYMMDD: string | null = null;
      if (dataNt && dataNt.length >= 8) {
        dateYYYYMMDD = dataNt.slice(0, 8);
      }

      console.log(`Item #${i + 1}: Title="${title}", dateYYYYMMDD=${dateYYYYMMDD}, Allowed=${dateYYYYMMDD ? allowedDates.has(dateYYYYMMDD) : false}`);
    });

  } catch (err) {
    console.error("[TEST AAStocks] Error:", err);
  }
}

testAastocks();
