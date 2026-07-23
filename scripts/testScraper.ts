import { renderPage, closeBrowser } from "../src/scrapers/core/browser";
import { extractArticle } from "../src/scrapers/core/extractor";
import { extractChineseContent, toSimplified } from "../src/utils/textUtils";
import { scrapeFutunnNewsList } from "../src/scrapers/sources/futunn";

async function runLocalTest() {
  const stockCode = "00005-HK";
  const stockName = "HSBC（0005.HK）";
  const newsUrl = `https://www.futunn.com/hk/stock/${stockCode}/news`;

  try {
    console.log(`[TEST] Rendering news list for stock ${stockCode} at ${newsUrl}...`);
    const newsItems = await scrapeFutunnNewsList(newsUrl, stockName);

    console.log(`[TEST] Found ${newsItems.length} news items.`);
    if (newsItems.length > 0) {
      console.log("[TEST] Sample News Item:", JSON.stringify(newsItems[0], null, 2));

      const sampleArticleUrl = newsItems[0].href;
      console.log(`[TEST] Fetching and extracting article from: ${sampleArticleUrl}...`);

      const html = await renderPage(sampleArticleUrl);
      const article = extractArticle(html, sampleArticleUrl);

      console.log(`[TEST] Extracted Raw Title:`, article.title);
      console.log(`[TEST] Raw Content Length: ${article.length} characters`);

      if (article.textContent) {
        const chineseOnly = extractChineseContent(article.textContent);
        const simplifiedChinese = toSimplified(chineseOnly);

        console.log(`[TEST] Extracted Chinese-Only Length: ${simplifiedChinese.length} characters`);
        console.log(`[TEST] Simplified Chinese Content Snippet:\n`, simplifiedChinese.slice(0, 400));
      }
    }
  } finally {
    await closeBrowser();
  }
}

runLocalTest().catch((err) => {
  console.error("[TEST] Error in test run:", err);
  process.exit(1);
});
