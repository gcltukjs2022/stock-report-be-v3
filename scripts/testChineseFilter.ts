import { renderPage, closeBrowser } from "../src/scrapers/core/browser";
import { extractArticle } from "../src/scrapers/core/extractor";

async function testFilter() {
  const sampleArticleUrl = "https://news.futunn.com/hk/post/76365874/consumer-finance-market-to-surpass-14-trillion-by-2031-with";

  console.log(`[TEST] Fetching: ${sampleArticleUrl}...`);
  const html = await renderPage(sampleArticleUrl);
  const article = extractArticle(html, sampleArticleUrl);

  if (!article.textContent) {
    console.log("No text content found.");
    await closeBrowser();
    return;
  }

  console.log("=== ORIGINAL RAW TEXT ===");
  console.log(article.textContent.slice(0, 1500));
  console.log("==========================\n");

  await closeBrowser();
}

testFilter();
